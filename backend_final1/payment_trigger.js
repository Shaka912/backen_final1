const utils = require("./utils/utils");
const payment = require("./models/payment");
const likecount = require("./models/likecount");

module.exports = async () => {
  const pipeline = [
    {
      $match: {
        operationType: "delete",
      },
    },
  ];

  // Monitor new listings using EventEmitter's on() function.
  await monitorListingsUsingEventEmitter(payment, pipeline);
  await monitorListingsUsingEventEmitter(likecount, pipeline);
};

function closeChangeStream(timeInMs = 60000, changeStream) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Closing the change stream");
      changeStream.close();
      resolve();
    }, timeInMs);
  });
}

async function monitorListingsUsingEventEmitter(
  client,
  pipeline = []
  //   timeInMs = 60000,
) {
  const changeStream = client.watch(pipeline);

  changeStream.on("change", async (next) => {
    const coll = next.ns.coll;
    await utils.sendFcmMessage(
      coll === "likecounts" ? "You Got More Likes" : "Subscription Expired",
      coll === "likecounts" ? "Hi, open app & enjoy" : "Please Subscribe Again",
      [await utils.getTokenByUserId(next.documentKey._id)]
    );
  });

//   await closeChangeStream(timeInMs, changeStream);
}
