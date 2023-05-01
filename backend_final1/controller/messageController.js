const Messages = require("../models/message");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
        from: { $in: [from, to] },
        to: { $in: [from, to] },
    }).sort({ updatedAt: 1 });
    res.json({ messages: messages });
  } catch (ex) {
    res.json({ error: "Something went wrong" });
  }
};

module.exports.addMessage = async (payload) => {
  try {
    const { from, to, message, timeStamp } = payload;
    const response = await Messages.create({
      message: { text: message },
      timeStamp: timeStamp,
      from: from,
      to: to,
    });

    if (response) return { response };
    else return { error: "error while saving message in db" };
  } catch (ex) {
    return { error: "error while saving message in db" };
  }
};
