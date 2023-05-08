require("dotenv").config();
const http = require("http");
const cors = require("cors");
const express = require("express");
const conecttomongo = require("./db");
const utils = require("./utils/utils");
const admin = require("firebase-admin");
var bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/adminpanel");
const trigger = require("./payment_trigger");
const msgRoutes = require("./routes/message");
const tokenRoutes = require("./routes/token");
const friendsRoutes = require("./routes/friend");
const paymentRoutes = require("./routes/payment");
var serviceAccount = require("./utils/serviceAccountKey.json");
const { addMessage } = require("./controller/messageController");
const Friend = require("./models/friends");
const port = 80;
const app = express();


app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/uploads", express.static("./uploads"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

conecttomongo();

utils.mkdir("./uploads");

app.use("/api/auth", authRoutes);
app.use("/api/auth", msgRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

trigger();



const server = http.createServer(app);
  const io = require("socket.io")(server, {
    cors: {
      origin: `http://172.31.7.168:${port}`,
    },
  });

  global.onlineUsers = new Map();
  io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
	onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", async (data) => {
      const { error, response } = await addMessage(data);
      if (response) {
        const token = await utils.getTokenByUserId(data.to);
        if (token) {
          await utils.sendFcmMessage(data.name, data.message, [token]);
        }
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
          socket.to(sendUserSocket).emit("msg-recieve", data);
	  socket.to(sendUserSocket).emit("new-msg", data);
        }
      }
    });
    socket.on("send-match", async (data) => {
      let fr = await Friend.findOne({
        uid: { $eq: data.uid },
        friendId: { $eq: data.fid },
      });
      if (!fr) {
        fr = await Friend.findOne({
          uid: { $eq: data.fid },
          friendId: { $eq: data.uid },
        });
      }
      const frs = onlineUsers.get(data.fid);
        if (frs) {
          socket.to(frs).emit("new-like", data);
        }
      if (fr && fr.both) {
       // const us = onlineUsers.get(data.uid);
        const fs = onlineUsers.get(data.fid);
       // if (us) {
         // io.to(us).emit("new-match", data);
       // }
        if (fs) {
          socket.to(fs).emit("new-match", data);
        }
      }
    });
  });
server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
