const mongoose = require("mongoose");
const { Schema } = mongoose;

const UniversitySchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  university: {
    type: String,
    required: true,
  },
});
const university = mongoose.model("university", UniversitySchema);

module.exports = university;
