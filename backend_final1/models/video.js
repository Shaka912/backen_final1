const mongoose = require("mongoose");
const { Schema } = mongoose;

const VideoSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  path: {
    type: String,
    required: true,
  },
});

const profilevideo = mongoose.model("profilevideo", VideoSchema);

module.exports = profilevideo;
