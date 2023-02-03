const mongoose = require("mongoose");
const { Schema } = mongoose;

const FriendSchema = new Schema({
  uid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  both: {
    type: Boolean,
    default: false,
  }
});

const friends = mongoose.model("friends", FriendSchema);

module.exports = friends;
