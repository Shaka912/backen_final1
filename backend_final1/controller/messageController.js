const Messages = require("../models/message");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      from: { $eq: from },
      to: { $eq: to },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        from: msg.sender.toString(),
        to: msg.users[1].toString(),
        message: msg.message.text,
      };
    });
    res.json({ messages: projectedMessages });
  } catch (ex) {
    res.json({ error: "Something went wrong" });
  }
};

module.exports.addMessage = async (payload) => {
  try {
    const { from, to, message } = payload;
    const response = await Messages.create({
      message: { text: message },
      from: from,
      to: to,
    });

    if (response) return { response };
    else return { error: "error while saving message in db" };
  } catch (ex) {
    return { error: "error while saving message in db" };
  }
};
