require("dotenv").config();
const { Router } = require("express");
const User = require("../models/User");
const { check, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const router = Router();
const { randomUUID } = require("crypto");
const passwordHash = require("password-hash");
const jwt = require("jsonwebtoken");

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
      const pass = randomUUID();
      const hashedPassword = passwordHash.generate(pass);
      const { email } = req.body;
      const candidate = await User.findOne({ email });
      if (candidate) {
        return res
          .status(400)
          .json({ type: "error", value: "Такой email уже зарегистрирован" });
      }
      const user = new User({
        email,
        hashedPassword,
      });
      await user.save();
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
      return res.status(200).json({
        type: "data",
        value: true,
      });
    } catch (e) {
      console.dir(e);
      return res.status(500).json({ type: "erroe", value: e.message });
    }
  }
);

// /api/auth
router.put(
  "/resignin",
  // [check("email", "Некорректный email").isEmail()],
  async (req, res) => {
    try {
      // const error = validationResult(req);
      // if (!error.isEmpty()) {
      //   return res.status(400).json({type: "error", value: error.array() });
      // }
      const pass = randomUUID();
      const hashedPassword = passwordHash.generate(pass);
      const { email } = req.body;
      const candidate = await User.findOne({ email });
      if (candidate) {
        await User.findOneAndUpdate(
          { email: email },
          { ...candidate._doc, hashedPassword: hashedPassword }
        );
        return res.status(200).json({
          type: "data",
          value: true,
        });
      }
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
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

// /api/auth
// router.post("/registration", async (req, res) => {
//   try {
//     const { email, passwordMail } = req.body;
//     const error = validationResult(req);
//     if (!error.isEmpty()) {
//       return res.status(400).json({ errors: error.array() });
//     }
//     const candidate = await User.findOne({ email });
//     if (
//       candidate &&
//       passwordHash.verify(passwordMail, candidate.hashedMailPassword)
//     ) {
//       const token = jwt.sign(
//         { userId: candidate._doc._id },
//         process.env.JWT_SECRET,
//         {
//           expiresIn: "1h",
//         }
//       );
//       res.status(200).json({
//         token: token,
//         userID: candidate._doc._id,
//         message: "User logged in successfully",
//         status: 200,
//       });
//     } else {
//       res.status(500).json({ error: "Не верный пароль" });
//     }
//   } catch (e) {
//     return res.status(500).json({ message: e.message });
//   }
// });

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
      const candidate = await User.findOne({ email });
      if (
        candidate &&
        passwordHash.verify(password, candidate.hashedPassword)
      ) {
        const token = jwt.sign(
          { userId: candidate._doc._id },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );
        res.status(200).json({
          token: token,
          userID: candidate._doc._id,
          value: true,
          type: "data",
        });
      } else {
        res.status(500).json({ type: "error", value: "Не верный пароль" });
      }
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

module.exports = router;
