const { Schema, model } = require("mongoose");

const schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  isVerificated: {
    type: Boolean,
  },
  created_at: {
    type: String,
  },
  token: {
    type: String,
  },
  name: {
    type: String,
  },
  surname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

module.exports = model("Users", schema);
