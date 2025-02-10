const { Schema, model, Types } = require("mongoose");

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
  // hashedMailPassword: {
  //   type: String,
  //   required: true,
  // },
  // name: {
  //   type: String,
  //   required: true,
  // },
  // surname: {
  //   type: String,
  //   required: true,
  // },
  token: {
    type: String,
  },
});

module.exports = model("User", schema);
