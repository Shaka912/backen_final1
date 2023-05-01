const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Video = require("../models/video");
const User = require("../models/users");
const Dob = require("../models/dob");
const Name = require("../models/name");
const Image = require("../models/pic");
const Gender = require("../models/gender");
const Places = require("../models/places");
const Bio = require("../models/bio");
const Location = require("../models/location");
const admin = require("../models/admin");
const fetchadmin = require('../middleware/fetchadmin')
const jwt_secrect = "totot1232";
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose");

const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const xpath = require("path");
const multer = require("multer");
const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "AKIA5NPQUPVRCHWQ5R73",
    secretAccessKey: "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",
  },
});

const Storage = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: "cokastorage",
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + xpath.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: Storage,
}).single("file");
const uploadvideo = multer({
  storage: Storage,
}).fields([{name:'file',maxCount:1},{name:'video',maxCount:1}]);

const {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
} = require("@aws-sdk/client-mediaconvert");
const { SQSClient,ReceiveMessageCommand,DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const sqsQueueUrl =
  "https://sqs.us-east-1.amazonaws.com/922312015202/rekogination";
const sqsClient = new SQSClient({ region: "us-east-1" });
const endpoint = "https://q25wbt2lc.mediaconvert.us-east-1.amazonaws.com";

const client_media = new MediaConvertClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: "https://q25wbt2lc.mediaconvert.us-east-1.amazonaws.com",
});


//creating admin
router.post(
  "/createadmin",
  [
    body("email", "please enter a valid username").exists(),
    body("password", "password must be at least 5characters").isLength({
      min: 5,
    }),
    body("name", "please enter a valid username").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let user = await admin.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry The username is already is taken" });
      }
      const salt = await bcrypt.genSalt(10);
      const secpass = await bcrypt.hash(req.body.password, salt);

      user = await admin.create({
        password: secpass,
	name:req.body.name,
        email: req.body.email,
      });
      //res.json(user);
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      res.send({ authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("some error has accored");
    }
  }
);
//login for admin
router.post(
  "/login",
  [
    body("email", "Please enter valid username").exists(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    //error checking
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(403).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      let user = await admin.findOne({ email: email });
      if (user == null) {
        return res
          .status(401)
          .json({ errors: "Username or password is not correct" });
      }
      //comparing user password with password in database

      let passcompare = await bcrypt.compare(password, user.password);
      if (passcompare == false) {
        return res.status(402).json({ errors: "username" });
      }
      const data = {
        id: user.id,
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      const info ={
       id:user.id,
       token:authtoken,
	name:user.name
	};
      res.cookie("authtoken", authtoken, { httpOnly: true });
      res.json({ info });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error has occured");
    }
  }
);

// route for getting all registered users
router.get("/getusers",fetchadmin, async (req, res) => {
  try {
    const fusers = await User.find({
      
    });
    const users = [];
    for (let user of fusers) {
      const xdob = await Dob.findOne({ _id: { $eq: user.id } });
      const xname = await Name.findOne({ _id: { $eq: user.id } });
      const ximage = await Image.findOne({ _id: { $eq: user.id } });
      const xgender = await Gender.findOne({ _id: { $eq: user.id } });
      const xemail = await User.findOne({ _id: { $eq: user.id } });
 // const xuni = await University.findOne({ _id: { $eq: user.id } });
      // const msgs = await Message.find({
      //   users: {
      //     $all: [req.user.id, user.id],
      //   },
      // })
      //   .sort({ updatedAt: -1 })
      //   .limit(1);
      users.push({
        id: xemail !== null ? xemail._id :null,
        email: xemail !== null ? xemail.email : null,
        dob: xdob !== null ? xdob.dob : null,
        name: xname !== null ? xname.name : null,
        photo: ximage !== null ? ximage.path : null,
        gender: xgender !== null ? xgender.gender : null,
       // university: xuni !== null ? xuni.university : null,
        // lastmessage: msgs.length == 0 ? "Say Hi" : msgs[0].message.text,
      });
    }
    return res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

//route for deleting the user
router.delete("/deleteuser/:id",fetchadmin, async (req, res) => {
  try {
    //find the listing to be deleted and delete it
  let user1 = User.findById(req.params.id);
  if (!user1) {
    return res.status(404).send("Not Found");
  }
  user1 = await User.findByIdAndDelete(
    req.params.id,
   
  );
 return res.send("Successfully deleted")
  } catch (error) {
    console.log(error);
      res.status(500).send("some error has accored");
  }
});
//route for creating user from admin panel

router.post("/user-add",
uploadvideo,
fetchadmin, async (req, res) => {
var uid = uuidv4();
let _id = new mongoose.Types.ObjectId(); 
  try {
  //error checking
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(403).json({ error: errors.array() });
    }
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res
        .status(400)
        .json({ error: "Sorry The email is already is taken" });
    }
    
    const salt = await bcrypt.genSalt(10);
    const secpass = await bcrypt.hash(req.body.password, salt);

    const xuser = await User.create({
      _id: _id,
      email: req.body.email,
      password: secpass,
    });
    const xname = await Name.create({ name: req.body.name, _id: _id });
    const xbio = await Bio.create({ bio: req.body.bio, _id: _id });
    const xgender = await Gender.create({ gender: req.body.gender, _id: _id });
    const xdob = await Dob.create({ dob: req.body.dob, _id: _id });
    const xlocation = await Location.create({
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      _id: _id,
    });
	console.log(req.files.file.key);
          const dd = await Image.create({
            _id: _id,
            path: `http://d1swej1r4a7z0w.cloudfront.net/${req.files.file[0].key}`,
          });  
 try {
      
            const command12 = new CreateJobCommand({
              Role: "arn:aws:iam::922312015202:role/service-role/MediaConvert_Default_Role",
              Settings: {
                Inputs: [
                  {
                    FileInput: `s3://cokastorage/${req.files.video[0].key}`,
                    AudioSelectors: {
                      "Audio Selector 1": {
                        Offset: 0,
                        SelectorType: "LANGUAGE_CODE",
                        DefaultSelection: "DEFAULT",
                        LanguageCode: "ENM",
                        ProgramSelection: 1,
                      },
                    },
                    VideoSelector: {
                      Rotate: "AUTO",
                    },
                  },
                ],
                OutputGroups: [
                  {
                    Name: "Apple HLS",
                    Outputs: [
                      {
                        ContainerSettings: {
                          Container: "M3U8",
                          M3u8Settings: {},
                        },
                        VideoDescription: {
                          CodecSettings: {
                            Codec: "H_264",
                            H264Settings: {
                              MaxBitrate: 8000000,
                              RateControlMode: "QVBR",
                              SceneChangeDetect: "TRANSITION_DETECTION",
                            },
                          },
                        },
                        AudioDescriptions: [
                          {
                            CodecSettings: {
                              Codec: "AAC",
                              AacSettings: {
                                Bitrate: 96000,

                                CodingMode: "CODING_MODE_2_0",
                                SampleRate: 48000,
                              },
                            },
                          },
                        ],
                        OutputSettings: {
                          HlsSettings: {},
                        },
                        NameModifier: "hls",
                      },
                    ],
                    OutputGroupSettings: {
                      Type: "HLS_GROUP_SETTINGS",
                      HlsGroupSettings: {
                        SegmentLength: 10,
                        Destination: "s3://cokastorage/",
                        MinSegmentLength: 0,
                      },
                    },
                  },
                ],
                Priority: 0,
              },
            });
            let mod = false;
            // transcoding mp4 to HLS format
            let job = false;
            const response12 = await client_media.send(command12);
            
            console.log(response12);
            console.log("converting..");

            let st = req.files.video[0].key;
            let x = st.split(".");
            const newx = x[0] + "hls.m3u8";
            const command_getjob = new GetJobCommand({ Id: response12.Job.Id });
            var i = 1;
            function myLoop() {
              setTimeout(async function () {
                let response_getjob = await client_media.send(command_getjob);
                if (response_getjob.Job.Status === "COMPLETE") {
                  console.log("Complete");
                  const dd = await Video.create({
                    _id: _id,
                    path: `http://d1swej1r4a7z0w.cloudfront.net/${newx}`,
                  });
                  console.log(newx)
                  i = 5;
                } else if (response_getjob.Job.Status === "ERROR") {
                  console.log("ERROR has occured");
                  return res.status(401).json({
                    error: "Sorry try again ",
                  });
                }
                i++;
                if (i < 4) {
                  myLoop();
                }
              }, 20000);
            }
            myLoop();
         
      } catch (error) {
        console.log(error)
      }

    return res
      .status(200)
      .json({ message: "User added successfully. Refreshing data..." });
    //   }
  } catch (error) {
    console.log(error);
  }
});
module.exports = router;
