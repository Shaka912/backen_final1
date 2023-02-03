const jwt_secrect = "hello$123";
const jwt = require("jsonwebtoken");

const Payment = require("../models/payment");
const LikeCount = require("../models/likecount");

// get the user from jwt
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ error: "User Not Authorized" });
  }
  try {
    req.user = jwt.verify(token, jwt_secrect);
    if (req.user) {
      req.user.likecount = -1;
      req.user.payment = await Payment.findById(req.user.id);
      if (!req.user.payment) {
        req.user.likecount = 0;
        const likeCount = await LikeCount.findById(req.user.id);
        if (likeCount) {
          req.user.likecount = likeCount.likeCount;
        }
      }
      next();
    }
  } catch (error) {
    res.status(401).send({ error: "User Not Authorized" });
  }
};
module.exports = fetchuser;
