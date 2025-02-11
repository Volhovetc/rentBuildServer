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
        return res.status(400).json({ errors: error.array() });
      }
      const pass = randomUUID();
      const hashedPassword = passwordHash.generate(pass);
      const { email, repeat } = req.body;

      const candidate = await User.findOne({ email });
      if (candidate && !repeat) {
        return res
          .status(400)
          .json({ message: "Такой email уже зарегистрирован" });
      }

      if (candidate && repeat) {
        const update = { ...candidate, hashedPassword: hashedPassword };
        await User.findOneAndUpdate({ email: email }, update);
        return res.status(200).json({
          message: "Email sent successfully",
          status: 200,
          email: email,
          password: `Ваш пароль для входа: ${pass}`,
          first: candidate,
          update: update,
        });
      }

      const user = new User({
        email,
        hashedPassword,
      });

      await user.save();

      // const transporter = nodemailer.createTransport({
      //   host: process.env.HOSTNAME,
      //   port: 465,
      //   secure: true,
      //   auth: {
      //     user: process.env.BOT,
      //     pass: process.env.PASSWORD,
      //   },
      //   tls: {
      //     rejectUnauthorized: false,
      //   },

      // });
      // await transporter.sendMail({
      //   from: process.env.BOT,
      //   to: email,
      //   subject: "Создание аккаунта",
      //   text: `Ваш пароль для входа: ${pass}`,
      // });

      return res.status(200).json({
        message: "Email sent successfully",
        status: 200,
        email: email,
        password: `Ваш пароль для входа: ${pass}`,
      });
    } catch (e) {
      console.dir(e);
      return res.status(500).json({
        message: e.message,
      });
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
          message: "User logged in successfully",
          status: 200,
        });
      } else {
        res.status(500).json({ error: "Не верный пароль" });
      }
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

module.exports = router;
