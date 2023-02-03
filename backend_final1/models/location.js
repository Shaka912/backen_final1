const mongoose = require("mongoose");
const { Schema } = mongoose;

const LocationSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  latitude: {
    type: String,
    required: true,
  },
  longitude: {
    type: String,
    required: true,
  }
});

const Location = mongoose.model("location", LocationSchema);

module.exports = Location;
