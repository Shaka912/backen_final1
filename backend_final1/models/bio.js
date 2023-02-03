const mongoose = require("mongoose");
const { Schema } = mongoose;

const BioSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  bio: {
    type: String,
    required: true,
  },
});

const Bio = mongoose.model("bio", BioSchema);

module.exports = Bio;
