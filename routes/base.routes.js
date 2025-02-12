require("dotenv").config();
const { Router } = require("express");
const router = Router();
const Users = require("../models/Users");
const jwt = require("jsonwebtoken");

// /api/base/
router.post("/data", async (req, res) => {
  try {
    console.log(req.header("authorization"));
    const token = req.header("authorization").substring(7, authHeader.length);
    console.log(token);
    if (!token)
      return res
        .status(401)
        .json({ type: "error", value: "Авторизация не пройдена" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded.userId)
      return res
        .status(401)
        .json({ type: "error", value: "Авторизация не пройдена" });

    const User = await Users.findOne({ _id: decoded.userId });
    if (!User)
      return res
        .status(404)
        .json({ type: "error", value: "Пользователь не найден" });

    const { name, surname, lastname, role } = req.body;
    await Users.findOneAndUpdate(
      { _id: decoded.userId },
      {
        ...User._doc,
        name: name,
        surname: surname,
        lastname: lastname,
        role: role,
      }
    );
    res.status(200).json({ type: "success", value: "Данные сохранены" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;
