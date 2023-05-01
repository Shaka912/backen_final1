const express = require("express");
const router = express.Router();

const Dob = require("../models/dob");
const Bio = require("../models/bio");
const Name = require("../models/name");
const Image = require("../models/pic");
const User = require("../models/users");
const Video = require("../models/video");
const Gender = require("../models/gender");
const Friend = require("../models/friends");
const University = require("../models/uni");
const Message = require("../models/message");
const Likes = require("../models/likecount");
const Location = require("../models/location");

const fetchuser = require("../middleware/fetchuser");

const getUserObject = async (rid, uid) => {
  const xuser = await User.findOne({
    _id: { $eq: uid },
  });
  const xbio = await Bio.findOne({ _id: { $eq: xuser.id } });
  const xdob = await Dob.findOne({ _id: { $eq: xuser.id } });
  const xname = await Name.findOne({ _id: { $eq: xuser.id } });
  const ximage = await Image.findOne({ _id: { $eq: xuser.id } });
  const xvideo = await Video.findOne({ _id: { $eq: xuser.id } });
  const xgender = await Gender.findOne({ _id: { $eq: xuser.id } });
  const xuni = await University.findOne({ _id: { $eq: xuser.id } });
  const xlocation = await Location.findOne({ _id: { $eq: xuser.id } });
  const msgs = await Message.find({
    from: { $eq: rid },
    to: { $eq: xuser.id },
  })
    .sort({ updatedAt: -1 })
    .limit(1);
  return {
    id: xuser.id,
    email: xuser.email,
    timestamp: xuser.timestamp,
    dob: xdob !== null ? xdob.dob : null,
    bio: xbio !== null ? xbio.bio : null,
    name: xname !== null ? xname.name : null,
    photo: ximage !== null ? ximage.path : null,
    video: xvideo !== null ? xvideo.path : null,
    photos: ximage !== null ? ximage.paths : null,
    gender: xgender !== null ? xgender.gender : null,
    university: xuni !== null ? xuni.university : null,
    latitude: xlocation !== null ? xlocation.latitude : null,
    longitude: xlocation !== null ? xlocation.longitude : null,
    lastmessage: msgs.length == 0 ? "Say Hi" : msgs[0].message.text,
  };
};

router.post("/addfriend", fetchuser, async (req, res) => {
  try {
    const friendID = req.body.friendId;
    if (!friendID) {
      return res.status(500).json({ error: "Friend Id is required" });
    }
    if (req.user.likecount >= 5) {
      return res.status(500).json({ outoflikes: "Out of Likes" });
    }
    if (req.user.likecount < 5) {
      if (req.user.likecount !== -1) {
        if (req.user.likecount === 0) {
          await Likes.create({
            _id: req.user.id,
            likeCount: req.user.likecount + 1,
          });
        } else {
          await Likes.updateOne(
            { _id: req.user.id },
            {
              $set: { likeCount: req.user.likecount + 1 },
            }
          );
        }
      }
      const x1 = await Friend.findOne({
        uid: { $eq: req.user.id },
        friendId: { $eq: friendID },
      });
      const x2 = await Friend.findOne({
        uid: { $eq: friendID },
        friendId: { $eq: req.user.id },
      });
      if (x1) return res.status(200).json({ error: "Already have a friend" });
      if (x2) {
        await Friend.updateOne(
          { uid: friendID, friendId: req.user.id },
          {
            $set: { both: true },
          }
        );
        return res
          .status(200)
          .json({ _id: x2._id, uid: x2.friendId, friendId: x2.uid, both: true });
      }
      const dd = await Friend.create({
        uid: req.user.id,
        friendId: friendID,
      });
      return res.status(200).json(dd);
    }
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/removefriend", fetchuser, async (req, res) => {
  try {
    const friendID = req.body.friendId;
    if (!friendID) {
      res.status(500).json({ error: "Friend Id is required" });
    }
    await Friend.deleteOne({
      uid: req.user.id,
      friendId: friendID,
    });
    await Friend.deleteOne({
      uid: friendID,
      friendId: req.user.id,
    });
    res.json({ friendId: "Friend Removed" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/blockfriend", fetchuser, async (req, res) => {
  try {
    const friendID = req.body.friendId;
    if (!friendID) {
      return res.status(500).json({ error: "Friend Id is required" });
    }
    await Friend.updateOne(
      { uid: req.user.id, friendId: friendID },
      {
        $set: { block: true },
      }
    );
    await Friend.updateOne(
      { uid: friendID, friendId: req.user.id },
      {
        $set: { block: true },
      }
    );
    return res.status(200).json({ message: "User Blocked" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/unblockfriend", fetchuser, async (req, res) => {
  try {
    const friendID = req.body.friendId;
    if (!friendID) {
      return res.status(500).json({ error: "Friend Id is required" });
    }
    await Friend.updateOne(
      { uid: req.user.id, friendId: friendID },
      {
        $set: { block: false },
      }
    );
    await Friend.updateOne(
      { uid: friendID, friendId: req.user.id },
      {
        $set: { block: false },
      }
    );
    return res.status(200).json({ message: "User UnBlocked" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/getfriends", fetchuser, async (req, res) => {
  try {
    const fusers = await Friend.find({
      uid: { $eq: req.user.id },
      both: true,
      block: false,
    });
    const musers = await Friend.find({
      friendId: { $eq: req.user.id },
      both: true,
      block: false,
    });
    const messages = await Message.find({
      to: { $eq: req.user.id },
    });
    const users = [];
    for (let user of fusers) {
      const us = await getUserObject(req.user.id, user.friendId);
      users.push(us);
    }
    for (let user of musers) {
      const us = await getUserObject(req.user.id, user.uid);
      users.push(us);
    }
    for (let user of messages) {
      const us = await getUserObject(req.user.id, user.from);
	    let block = await Friend.find({
      friendId: { $eq: req.user.id },
	uid: { $eq: user.from },
      block: true,
    });
	    if (!block){
		    let block = await Friend.find({
      uid: { $eq: req.user.id },
        friendId: { $eq: user.from },
      block: true,
    });
	    }
      if (users.findIndex((e) => e.id == us.id) == -1 && !block) {
       users.push(us);
      }
    }
    return res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

router.get("/getblockfriends", fetchuser, async (req, res) => {
  try {
    const fusers = await Friend.find({
      uid: { $eq: req.user.id },
      block: true,
    });
    const musers = await Friend.find({
      friendId: { $eq: req.user.id },
      block: true,
    });
    const users = [];
    for (let user of fusers) {
      const us = await getUserObject(req.user.id, user.friendId);
      users.push(us);
    }
    for (let user of musers) {
      const us = await getUserObject(req.user.id, user.uid);
      users.push(us);
    }
    return res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

router.get("/getremainingtime", fetchuser, async (req, res) => {
  try {
    const likeCount = await Likes.findById(req.user.id);
    if (likeCount) {
      if (likeCount.likeCount > 4) {
        const timePassed = Date.now() - Date.parse(likeCount.updatedAt);
        const timeLeft = 12 * 60 * 60 * 1000 - timePassed;
        return res.status(200).json({ remainingTime: timeLeft });
      }
    }
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

module.exports = router;

