const mongoose = require("mongoose");
const { Schema } = mongoose;

const TokenSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  token: {
    type: String,
    required: true,
  },
});

const token = mongoose.model("token", TokenSchema);

module.exports = token;
