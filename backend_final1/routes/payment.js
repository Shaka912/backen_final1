const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");

const jwt_secrect = "hello$123";
const jwt = require("jsonwebtoken");

const Dob = require("../models/dob");
const Name = require("../models/name");
const Image = require("../models/pic");
const Video = require("../models/video");
const Gender = require("../models/gender");
const University = require("../models/uni");
const Payment = require("../models/payment");
const Likes = require("../models/likecount");

router.get("/getpayment", fetchuser, async (req, res) => {
  const xpay = await Payment.findOne({ _id: { $eq: req.user.id } });
  res.json({ payment: xpay });
});

router.post("/addpayment", fetchuser, async (req, res) => {
  const payment = req.body.payment;
  const expireAfter = req.body.expireAfter;

  const expireDate = new Date(Date.now());
  expireDate.setMonth(expireDate.getMonth() + expireAfter);
  // expireDate.setMinutes(expireDate.getMinutes() + expireAfter);

  try {
    const isOK = await Payment.create({
      _id: req.user.id,
      expireAt: expireDate,
      paymentType: payment.type,
      description: payment.description,
      cardDetails: payment.info.cardDetails,
      cardNetwork: payment.info.cardNetwork,
      token: payment.tokenizationData.token,
      tokenType: payment.tokenizationData.type,
      locality: payment.info.billingAddress.locality,
      cardHolderName: payment.info.billingAddress.name,
      postalCode: payment.info.billingAddress.postalCode,
      countryCode: payment.info.billingAddress.countryCode,
      billingAddress: payment.info.billingAddress.address1,
      cardHolderPhone: payment.info.billingAddress.phoneNumber,
    });

    if (isOK) {
      await Likes.deleteOne({
        _id: req.user.id,
      });
    }

    const user = req.user;
    const data = {
      id: user.id,
      email: user.email,
    };
    const authtoken = jwt.sign(data, jwt_secrect);
    const xdob = await Dob.findOne({ _id: { $eq: user.id } });
    const xname = await Name.findOne({ _id: { $eq: user.id } });
    const ximage = await Image.findOne({ _id: { $eq: user.id } });
    const xvideo = await Video.findOne({ _id: { $eq: user.id } });
    const xpay = await Payment.findOne({ _id: { $eq: user.id } });
    const xgender = await Gender.findOne({ _id: { $eq: user.id } });
    const xuni = await University.findOne({ _id: { $eq: user.id } });
    res.json({
      user: {
        id: user.id,
        email: user.email,
        authtoken: authtoken,
        timestamp: user.timestamp,
        dob: xdob !== null ? xdob.dob : null,
        payment: xpay !== null ? true : false,
        name: xname !== null ? xname.name : null,
        photo: ximage !== null ? ximage.path : null,
        video: xvideo !== null ? xvideo.path : null,
        gender: xgender !== null ? xgender.gender : null,
        university: xuni !== null ? xuni.university : null,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
