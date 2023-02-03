const express = require("express");
const router = express.Router();
const token = require("../models/token");
const fetchuser = require("../middleware/fetchuser");

router.post("/addtoken", fetchuser, async (req, res) => {
  const token1 = req.body.token;
  try {
    const dd = await token.create({
      _id: req.user.id,
      token: token1,
    });
    res.json(dd);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/removetoken", fetchuser, async (req, res) => {
  try {
    const dd = await token.deleteOne({ _id: req.user.id });
    if (dd.acknowledged == true) {
      res.json({ token: "Token Removed" });
    } else {
      res.json({ token: "Token Not Removed" });
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
