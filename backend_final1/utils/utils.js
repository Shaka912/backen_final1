const fs = require("fs");
const admin = require("firebase-admin");
const Token = require("../models/token");

module.exports.mkdir = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
};

module.exports.rmFile = (path) => {
  if (fs.existsSync(`./${path}`)) {
    fs.rmSync(`./${path}`);
  }
};

module.exports.getTokenByUserId = async (id) => {
  const tokens = await Token.findOne({ _id: { $eq: id } });
  if (tokens) {
    return tokens.token;
  }
  return null;
};

module.exports.sendFcmMessage = async (title, body, tokens) => {
  const message = {
    data: {
      title: title,
      body: body,
    },

    tokens: tokens,
  };
  try {
    admin
      .messaging()
      .sendMulticast(message)
      .then((response) => {})
      .catch((error) => {
        console.error("FCM: ", error);
      });
  } catch (error) {
    console.error("FCM: ", error);
  }
};
