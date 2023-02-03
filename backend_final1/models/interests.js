const mongoose = require("mongoose");
const { Schema } = mongoose;

const IntrestSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  interests: {
    type: Array,
    required: true,
  },
});
const intrest = mongoose.model("intrests", IntrestSchema);

module.exports = intrest;
