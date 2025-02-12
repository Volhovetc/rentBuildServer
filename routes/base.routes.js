require("dotenv").config();
const { Router } = require("express");
const Users = require("../models/Users");
const User = require("../models/User");
const router = Router();
const jwt = require("jsonwebtoken");

// /api/base/
router.post("/data", async (req, res) => {
  try {
    const token = req.header("authorization");
    if (!token)
      return res
        .status(401)
        .json({ type: "error", value: "Авторизация не пройдена" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.userId)
      return res
        .status(401)
        .json({ type: "error", value: "Авторизация не пройдена" });

    const UserInBase = await Users.findOne({ _id: decoded.userId });
    if (!UserInBase)
      return res
        .status(404)
        .json({ type: "error", value: "Пользователь не найден" });

    const { name, surname, lastname, role } = req.body;
    const user = new User({
      name,
      surname,
      lastname,
      role,
      id: decoded.userId,
    });
    await user.save();
    res.status(200).json({ type: "success", value: "Данные сохранены" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});
