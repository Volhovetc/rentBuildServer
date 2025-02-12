require("dotenv").config();
const { Router } = require("express");
const router = Router();
const Users = require("../models/Users");
const { check, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");
const generatePassword = require("password-generator");

// /api/auth
router.post(
  "/signin",
  [check("email", "Некорректный email").isEmail()],
  async (req, res) => {
    try {
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ type: "error", value: error.array() });
      }
      const pass = customPassword();
      const hashedPassword = passwordHash.generate(pass);
      const { email } = req.body;
      const candidate = await Users.findOne({ email });
      if (candidate && candidate._doc.isVerificated) {
        return res
          .status(400)
          .json({ type: "error", value: "Такой email уже зарегистрирован" });
      }

      if (candidate && !candidate._doc.isVerificated) {
        await Users.findOneAndUpdate(
          { email: email },
          { ...candidate._doc, hashedPassword: hashedPassword }
        );
        sendMail(email, pass);
        return res.status(200).json({
          type: "data",
          value: false,
        });
      }
      let date = new Date();
      const user = new Users({
        email,
        hashedPassword,
        isVerificated: false,
        created_at: `${date.getDate()} - ${date.getMonth()} - ${date.getFullYear()}`,
      });
      await user.save();
      sendMail(email, pass);
      return res.status(200).json({
        type: "data",
        value: true,
      });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

router.post(
  "/login",
  [check("email", "Некорректный email").isEmail()],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
      }
      const candidate = await Users.findOne({ email });
      if (
        candidate &&
        passwordHash.verify(password, candidate.hashedPassword)
      ) {
        const token = jwt.sign(
          { userId: candidate._doc._id },
          process.env.JWT_SECRET,
          {
            expiresIn: "7d",
          }
        );
        if (!candidate._doc.isVerificated) {
          await Users.findOneAndUpdate(
            { email: email },
            { ...candidate._doc, isVerificated: true }
          );
        }
        res.status(200).json({
          token: token,
          value: true,
          type: "data",
        });
      } else {
        res.status(500).json({ type: "error", value: "Неверные данные" });
      }
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

module.exports = router;

const sendMail = async (email, pass) => {
  const transporter = nodemailer.createTransport({
    host: process.env.HOSTNAME,
    port: 465,
    secure: true,
    auth: {
      user: process.env.BOT,
      pass: process.env.PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  await transporter.sendMail({
    from: process.env.BOT,
    to: email,
    subject: "Создание аккаунта",
    text: `Ваш пароль для входа: ${pass}`,
  });
};

function isStrongEnough(password) {
  const uc = password.match(/([A-Z])/g);
  const lc = password.match(/([a-z])/g);
  const n = password.match(/([\d])/g);
  const sc = password.match(/([\?\-])/g);
  const nr = password.match(/([\w\d\?\-])\1{2,}/g);
  return (
    password.length >= 12 &&
    !nr &&
    uc &&
    uc.length >= 3 &&
    lc &&
    lc.length >= 3 &&
    n &&
    n.length >= 2 &&
    sc &&
    sc.length >= 2
  );
}

function customPassword() {
  let password = "";
  const randomLength = Math.floor(Math.random() * (18 - 12)) + 12;
  while (!isStrongEnough(password)) {
    password = generatePassword(randomLength, false, /[\w\d\?\-]/);
  }
  return password;
}
