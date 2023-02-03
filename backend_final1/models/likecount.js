const mongoose = require("mongoose");
const { Schema } = mongoose;

const LikeCountSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    likeCount: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true }
);

LikeCountSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 12 * 60 * 60 });

const likecount = mongoose.model("likecount", LikeCountSchema);

module.exports = likecount;
