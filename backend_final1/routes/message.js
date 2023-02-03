const { getMessages } = require("../controller/messageController");
const router = require("express").Router();

router.post("/getmsg", getMessages);

module.exports = router;