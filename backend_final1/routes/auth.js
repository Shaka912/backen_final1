const express = require("express");

const xpath = require("path");
const router = express.Router();
const multer = require("multer");
const bcrypt = require("bcryptjs");
const mongodb = require("mongodb");
const jwt = require("jsonwebtoken");
const multerS3 = require("multer-s3");
const nodemailer = require("nodemailer");
const { S3Client } = require("@aws-sdk/client-s3");

const Bio = require("../models/bio");
const Dob = require("../models/dob");
const Name = require("../models/name");
const Image = require("../models/pic");
const User = require("../models/users");
const Video = require("../models/video");
const Gender = require("../models/gender");
const PGender = require("../models/pgender");
const University = require("../models/uni");
const Friend = require("../models/friends");
const Message = require("../models/message");
const Payment = require("../models/payment");
const Location = require("../models/location");
const Intrests = require("../models/interests");


const {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand
} = require("@aws-sdk/client-mediaconvert");
const { RekognitionClient, DetectModerationLabelsCommand,StartContentModerationCommand
, GetContentModerationCommand } = require("@aws-sdk/client-rekognition");
const { SQSClient,ReceiveMessageCommand,DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const utils = require("../utils/utils");

const { google } = require("googleapis");
const mediainfo = require("mediainfo-wrapper");
const isValidVideo = require("../middleware/video");
const fetchuser = require("../middleware/fetchuser");
const { body, validationResult } = require("express-validator");

const jwt_secrect = "hello$123";
const CLIENT_ID =
  "922045328145-mn8d9sqilq5j05du2241fv753bml93t3.apps.googleusercontent.com";
const SECERET = "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";
const refresh_token =
  "1//04A6ECqP588l8CgYIARAAGAQSNwF-L9IreOJV-Z2ggfeaADtxDDHgjrQ0pg_qK2p3uRBuYSB6M8QMxJs7V6XdY5WvmigPOE4FGi0";
const redirect_uri = "https://developers.google.com/oauthplayground";
const oAuth2client = new google.auth.OAuth2(CLIENT_ID, SECERET, redirect_uri);
oAuth2client.setCredentials({ refresh_token: refresh_token });

const s3 = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const client = new RekognitionClient({ region: 'us-east-1',
                       credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }, });

const client_media = new MediaConvertClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.MEDIACONVERT_URL,
});

const sqsQueueUrl = process.env.SQS_URL;
const sqsClient = new SQSClient({  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }, });



const Storage = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: process.env.AWS_BUCKET_NAME,
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

const uploads = multer({
  storage: Storage,
}).array("files", 5);



router.post(
  "/createuser",
  [
    body("email", "please enter a valid email").isEmail(),
    body("password", "password must be at least 5characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry The email is already is taken" });
      }
      const salt = await bcrypt.genSalt(10);
      const secpass = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        password: secpass,
        email: req.body.email,
      });
      const data = {
        id: user.id,
        email: user.email,
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          authtoken: authtoken,
          timestamp: user.timestamp,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Something went worng" });
    }
  }
);
//user login endpoint
router.post(
  "/login",
  [
    body("email", "Please enter valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    //error checking
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(403).json({ error: errors.array() });
    }
    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email: email });
      if (user == null) {
        return res.status(401).json({ error: "User not found" });
      }
      //comparing user password with password in database

      let passcompare = await bcrypt.compare(password, user.password);
      if (passcompare == false) {
        return res.status(402).json({ error: "Pasword not matched" });
      }
      const data = {
        id: user.id,
        email: user.email,
      };
      const authtoken = jwt.sign(data, jwt_secrect);
      const xbio = await Bio.findOne({ _id: { $eq: user.id } });
      const xdob = await Dob.findOne({ _id: { $eq: user.id } });
      const xname = await Name.findOne({ _id: { $eq: user.id } });
      const ximage = await Image.findOne({ _id: { $eq: user.id } });
      const xvideo = await Video.findOne({ _id: { $eq: user.id } });
      const xpay = await Payment.findOne({ _id: { $eq: user.id } });
      const xgender = await Gender.findOne({ _id: { $eq: user.id } });
      const xuni = await University.findOne({ _id: { $eq: user.id } });
      const xintrest = await Intrests.findOne({ _id: { $eq: user.id } });
      const xlocation = await Location.findOne({ _id: { $eq: user.id } });
      res.json({
        user: {
          id: user.id,
          email: user.email,
          authtoken: authtoken,
          timestamp: user.timestamp,
          dob: xdob !== null ? xdob.dob : null,
          bio: xbio !== null ? xbio.bio : null,
          payment: xpay !== null ? true : false,
          name: xname !== null ? xname.name : null,
          photo: ximage !== null ? ximage.path : null,
          video: xvideo !== null ? xvideo.path : null,
          photos: ximage !== null ? ximage.paths : null,
          gender: xgender !== null ? xgender.gender : null,
          university: xuni !== null ? xuni.university : null,
          intrest: xintrest !== null ? xintrest.intrest : null,
          latitude: xlocation !== null ? xlocation.latitude : null,
          longitude: xlocation !== null ? xlocation.longitude : null,
        },
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);
router.post("/usergender", fetchuser, async (req, res) => {
  try {
    const gender = req.body.gender;
    //creating gender
    const gen = await Gender.create({
      _id: req.user.id,
      gender: gender,
    });
    res.json(gen);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
router.post("/userpreferedgender", fetchuser, async (req, res) => {
  try {
    const gender = req.body.gender;
    //creating gender
    const gen = await PGender.create({
      _id: req.user.id,
      gender: gender,
    });
    res.json(gen);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
router.get("/userpreferedgender", fetchuser, async (req, res) => {
  try {
    const gen = await PGender.findById(req.user.id);
    res.json(gen);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
router.post("/userdob", fetchuser, async (req, res) => {
  try {
    const dob = req.body.dob;
    //creating dob
    const dd = await Dob.create({
      _id: req.user.id,
      dob: dob,
    });
    res.json(dd);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});
router.post("/username", fetchuser, async (req, res) => {
  try {
    const name = req.body.name;
    //creating name
    let dd = null;
    const fname = await Name.findOne({ _id: { $eq: req.user.id } });
    if (!fname) {
      dd = await Name.create({
        _id: req.user.id,
        name: name,
      });
    } else {
      await Name.updateOne(
        { _id: req.user.id },
        {
          $set: { name: name },
        }
      );
      dd = await Name.findOne({ _id: { $eq: req.user.id } });
    }
    res.json(dd);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/useruni", fetchuser, async (req, res) => {
  try {
    const university = req.body.university;
    const dd = await University.create({
      _id: req.user.id,
      university: university,
    });
    res.json(dd);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/userlocation", fetchuser, async (req, res) => {
  try {
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const dd = await Location.create({
      _id: req.user.id,
      latitude: latitude,
      longitude: longitude,
    });
    res.json(dd);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/uploaddp", fetchuser, (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        console.log(err);
        res.status(401).json({ error: "Not Uploaded" });
      } else {
        
        const command = new DetectModerationLabelsCommand({Image:{S3Object:{Bucket: process.env.AWS_BUCKET_NAME,
        Name: req.file.key},},});
        const response = await client.send(command);
        
	let no = false;
        response.ModerationLabels.forEach((label) => {
          if (label.ParentName === "Explicit Nudity") {
            no = true;
          }
        });
        if (no === true) {
          res
            .status(401)
            .json({ error: "Image Violates Our image Sharing Law" });
        }
	else {
	 const dd = await Image.create({
          _id: req.user.id,
          path: `http://di0j0bmyqgivc.cloudfront.net/${req.file.key}`
          // path: `/${req.file.path.replace(/\\/g, "/")}`,,
          //req.file.location,
        });
        res.json(dd);
	}
   }
   });
	 
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }

  
});

router.post("/uploadpics", fetchuser, (req, res) => {
  try {
    uploads(req, res, async (err) => {
      if (err) {
        console.log(err);
        res.status(401).json({ error: "Not Uploaded" });
      } else {
	let no = false;
        const paths = [];
	const paths1 =[];
        for (let file of req.files) {
         // paths.push(`/${file.path.replace(/\\/g, "/")}`);
	paths.push(file.key)
        }
         for (let i of paths) {
          const command = new DetectModerationLabelsCommand({
            Image: { S3Object: { Bucket: process.env.AWS_BUCKET_NAME , Name: i } },
          });
	 
          const response = await client.send(command);
          
          response.ModerationLabels.forEach((label) => {
            if (label.ParentName === "Explicit Nudity") {
              no = true;
              
            }
          });
        }
        if (no === true) {
          res
            .status(401)
            .json({ error: "Image Violates Our image Sharing Law" });
	return;
        }
        else {
	          for (let i of req.files) {  
            paths1.push(`http://di0j0bmyqgivc.cloudfront.net/${i.key}`);
          }
	          await Image.updateOne(
            { _id: req.user.id },
            {
              $set: { paths: paths1 },
            }
          );
	}
	        const dd = await Image.findOne({ _id: { $eq: req.user.id } });
        res.json(dd);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/updatedp", fetchuser, async (req, res) => {
  try {
    const pic = await Image.findOne({ _id: { $eq: req.user.id } });
    if (!pic) {
      res.status(500).json({ error: "Picture not found" });
      return;
    }
    utils.rmFile(pic.path);
    upload(req, res, async (err) => {
      if (err) {
        res.status(401).json({ error: "Not Uploaded" });
      } else {
	 const command = new DetectModerationLabelsCommand({
          Image: { S3Object: { Bucket: process.env.AWS_BUCKET_NAME , Name: req.file.key } },
        });
        const response = await client.send(command);
        let no = false;
        response.ModerationLabels.forEach((label) => {
          if (label.ParentName === "Explicit Nudity") {
            no = true;
          }
        });
        if (no === true) {
          res
            .status(401)
            .json({ error: "Image Violates Our image Sharing Law" });
          return;
        }
	else {

        await Image.updateOne(
          { _id: req.user.id },
          {
            $set: { path: `http://di0j0bmyqgivc.cloudfront.net/${req.file.key}` },
            // $set: { path: `/${req.file.path.replace(/\\/g, "/")}` },
          }
        );
        const dd = await Image.findOne({ _id: { $eq: req.user.id } });
        res.json(dd);
	}
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/updatevideo", fetchuser, async (req, res) => {
  try {
    const pic = await Video.findOne({ _id: { $eq: req.user.id } });
    if (!pic) {
      res.status(500).json({ error: "Picture not found" });
      return;
    }
    utils.rmFile(pic.path);
    upload(req, res, async (err) => {
      if (err) {
        return res.status(401).json({ error: "Not Uploaded" });
      } else {
        const command = new StartContentModerationCommand({
          Video: {
            S3Object: {
              Bucket: process.env.AWS_BUCKET_NAME,
              Name: req.file.key,
            },
          },
          NotificationChannel: {
            RoleArn: process.env.REKOGINATION_ROLE ,
            SNSTopicArn: process.env.SNS_ARN,
          },
        });
        const response = await client.send(command);
        let rep = "";
        const command1 = new GetContentModerationCommand({
          JobId: response.JobId,
        });
        let job = false;
        while (job == false) {
          const response1 = await client.send(command1);
          if (response1.JobStatus === "SUCCEEDED") {
            job = true;
            console.log(response1);
            rep = response1;
          }
        }
        if (rep.ModerationLabels.length > 1) {
          return res.status(401).json({
            error: "The video Contains Elements that are against our policies",
          });
        } else {
          await Video.updateOne(
            { _id: req.user.id },
            {
              $set: { path: `http://di0j0bmyqgivc.cloudfront.net/${req.file.key}` },
              // $set: { path: `/${req.file.path.replace(/\\/g, "/")}` },
            }
          );
          const dd = await Video.findOne({ _id: { $eq: req.user.id } });
          res.json(dd);
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/getmatches", fetchuser, async (req, res) => {
  try {
    let fusers = [];
    const f = await Friend.find({
      friendId: { $eq: req.user.id },
    });
    for (let x of f) {
      if (!x.both) {
        const user = await User.findOne({ _id: { $eq: x.uid } });
        if (user) fusers = [...fusers, user];
      }
    }
    if (fusers.length > 0) {
      const users = [];
      for (let user of fusers) {
        const xdob = await Dob.findOne({ _id: { $eq: user.id } });
        const xbio = await Bio.findOne({ _id: { $eq: user.id } });
        const xname = await Name.findOne({ _id: { $eq: user.id } });
        const xpay = await Payment.findOne({ _id: { $eq: user.id } });
        const ximage = await Image.findOne({ _id: { $eq: user.id } });
        const xvideo = await Video.findOne({ _id: { $eq: user.id } });
        const xint = await Intrests.findOne({ _id: { $eq: user.id } });
        const xgender = await Gender.findOne({ _id: { $eq: user.id } });
        const xuni = await University.findOne({ _id: { $eq: user.id } });
        const xlocation = await Location.findOne({ _id: { $eq: user.id } });
        const xfri = await Friend.findOne({
          uid: { $eq: req.user.id },
          friendId: { $eq: user.id },
        });
        const yfri = await Friend.findOne({
          uid: { $eq: user.id },
          friendId: { $eq: req.user.id },
        });
        const msgs = await Message.find({
          from: { $eq: req.user.id },
          to: { $eq: user.id },
        })
          .sort({ updatedAt: -1 })
          .limit(1);
        users.push({
          id: user.id,
          email: user.email,
          timestamp: user.timestamp,
          dob: xdob !== null ? xdob.dob : null,
          bio: xbio !== null ? xbio.bio : null,
          payment: xpay !== null ? true : false,
          name: xname !== null ? xname.name : null,
          video: xvideo !== null ? xvideo.path : null,
          photo: ximage !== null ? ximage.path : null,
          photos: ximage !== null ? ximage.paths : null,
          interests: xint !== null ? xint.interests : null,
          gender: xgender !== null ? xgender.gender : null,
          university: xuni !== null ? xuni.university : null,
          isfriend: xfri !== null || (yfri !== null && yfri.both),
          latitude: xlocation !== null ? xlocation.latitude : null,
          longitude: xlocation !== null ? xlocation.longitude : null,
          lastmessage: msgs.length == 0 ? "Say Hi" : msgs[0].message.text,
        });
      }
      return res.status(200).json({ users });
    }
    return res.status(200).json({});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

router.get("/getusers", fetchuser, async (req, res) => {
  try {
    const fusers = await User.find({
      _id: { $ne: req.user.id },
    });

    if (fusers.length > 0) {
      const users = [];
      for (let user of fusers) {
        const xdob = await Dob.findOne({ _id: { $eq: user.id } });
        const xbio = await Bio.findOne({ _id: { $eq: user.id } });
        const xname = await Name.findOne({ _id: { $eq: user.id } });
        const xpay = await Payment.findOne({ _id: { $eq: user.id } });
        const ximage = await Image.findOne({ _id: { $eq: user.id } });
        const xvideo = await Video.findOne({ _id: { $eq: user.id } });
        const xint = await Intrests.findOne({ _id: { $eq: user.id } });
        const xgender = await Gender.findOne({ _id: { $eq: user.id } });
        const xuni = await University.findOne({ _id: { $eq: user.id } });
        const xlocation = await Location.findOne({ _id: { $eq: user.id } });
        const xfri = await Friend.findOne({
          uid: { $eq: req.user.id },
          friendId: { $eq: user.id },
        });
        const yfri = await Friend.findOne({
          uid: { $eq: user.id },
          friendId: { $eq: req.user.id },
        });
        const msgs = await Message.find({
          from: { $in: [req.user.id, user.id] },
          to: { $in: [req.user.id, user.id] },
        })
          .sort({ updatedAt: -1 })
          .limit(1);
	 if (xfri){
	     if (xfri.block) continue;
	 }
	 if (yfri){
	     if (yfri.block) continue;
	 }
        users.push({
          id: user.id,
          email: user.email,
          timestamp: user.timestamp,
          dob: xdob !== null ? xdob.dob : null,
          payment: xpay !== null ? true : false,
          bio: xbio !== null ? xbio.bio : null,
          name: xname !== null ? xname.name : null,
          video: xvideo !== null ? xvideo.path : null,
          photo: ximage !== null ? ximage.path : null,
          photos: ximage !== null ? ximage.paths : null,
          interests: xint !== null ? xint.interests : null,
          gender: xgender !== null ? xgender.gender : null,
          university: xuni !== null ? xuni.university : null,
          isfriend: xfri !== null || (yfri !== null && yfri.both),
          latitude: xlocation !== null ? xlocation.latitude : null,
          longitude: xlocation !== null ? xlocation.longitude : null,
          lastmessage: msgs.length == 0 ? "Say Hi" : msgs[0].message.text,
        });
      }
      return res.status(200).json({ users });
    }
    return res.status(200).json({});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

router.post("/sendotp", fetchuser, async (req, res) => {
  const access_token = await oAuth2client.getAccessToken();
  try {
    if (req.user.email != req.body.email)
      return res
        .status(401)
        .json({ error: "enter same email as signup email" });
    const mailOptions = {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: "Coka OTP",
      html: `<p>Here is your Coka OTP ${3952}</p>`,
    };
    const transporter = await nodemailer.createTransport({
      service: "gmail",
      // host: "smtp.gmail.com",
      // port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        clientId: CLIENT_ID,
        clientSecret: SECERET,
        refreshToken: refresh_token,
        accessToken: access_token,
        user: process.env.EMAIL,
        // pass: process.env.PASSWORD,
        // https://console.developers.google.com/projectcreate
      },
    });
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "OTP send successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

router.post("/verifyotp", fetchuser, async (req, res) => {
  try {
    if (3952 != req.body.otp)
      return res.status(401).json({ error: "OTP is not valid" });
    return res.status(200).json({ message: "OTP Verified Successfully" });
  } catch (error) {
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

router.post("/removeuser", fetchuser, async (req, res) => {
  try {
    const dd = await User.deleteOne({
      _id: req.user.id,
    });
    if (dd.acknowledged)
      return res.status(200).json({ message: "Account Deleted Successfully" });
    return res.status(401).json({ error: "Account Not Deleted" });
  } catch (error) {
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

router.post("/uploadvideo", fetchuser, isValidVideo, (req, res) => {
  try {
    const userSocket = onlineUsers.get(req.user.id);
    upload(req, res, async (err) => {
      if (err) {
        res.status(401).json({ error: "Not Uploaded" });
      } else {
	console.log("uploading...");
	 const command = new StartContentModerationCommand({
          Video:{
            S3Object:{
              Bucket: process.env.AWS_BUCKET_NAME,
              Name: req.file.key
            },
          },
          NotificationChannel: {
            RoleArn: process.env.REKOGINATION_ROLE,
            SNSTopicArn: process.env.SNS_ARN,
          }
        });
	console.log(req.file.key);
	      if (userSocket) {
        chatSocket.to(userSocket).emit("upload", {});
      }

        const response = await client.send(command);
        console.log(response.JobId);
	 const command1 = new GetContentModerationCommand({JobId:response.JobId});
	let rep = '';
        let job = false;
       while(job ==false ){
        const response1 = await client.send(command1);
        if(response1.JobStatus==='SUCCEEDED'){
          job = true;
          console.log(response1);
	  rep = response1;
        }
	 else if (response1.JobStatus === "FAILED") {
            job = true;
            return res.status(401).json({
              error: "There was some error",
            });
          }
       }
	let checker = false;
	for ( let i=0; i<rep.ModerationLabels.length; i++){
  if(rep.ModerationLabels[i].ModerationLabel.ParentName =='Explicit Nudity' && rep.ModerationLabels[i].ModerationLabel.Confidence >85 ){
    checker = true;
  }
}
	if(checker === true  ){
        return res.status(401).json({ error: "The video Contains Elements that are against our policies" });
      }
	else {
	console.log(rep.ModerationLabels[3]);
	console.log(rep.ModerationLabels.ModerationLabel)
		if (userSocket) {
        chatSocket.to(userSocket).emit("transcode", {});
      }
	   console.log("Transcoding file...");
	
           const command12 = new CreateJobCommand({
            Role: process.env.MEDIA_CONVERT_ROLE,
            Settings: {
              Inputs:[
                {
                  FileInput: `s3://cokastorage12/${req.file.key}`,
		   "AudioSelectors": {
                    "Audio Selector 1": {
                      "Offset": 0,
                      "SelectorType": "LANGUAGE_CODE",
                      "DefaultSelection": "DEFAULT",
                      "LanguageCode": "ENM",
                      "ProgramSelection": 1
                    }
                  },
		VideoSelector: {
                    Rotate: "AUTO",
                  },
                }
              ],
             OutputGroups: [
                {
                  Name: "Apple HLS",
                  Outputs: [
                    {
                      ContainerSettings: {
                        Container: "M3U8",
                        M3u8Settings: {}
                      },
                      VideoDescription: {
                        CodecSettings: {
                          Codec: "H_264",
                          H264Settings: {
                            MaxBitrate: 8000000,
                            RateControlMode: "QVBR",
                            SceneChangeDetect: "TRANSITION_DETECTION"
                          }
                        }
                      },
                      AudioDescriptions: [
                        {
                          CodecSettings: {
                            Codec: "AAC",
                            AacSettings: {
                              Bitrate: 96000,
                              CodingMode: "CODING_MODE_2_0",
                              SampleRate: 48000
                            }
                          }
                        }
                      ],
                      OutputSettings: {
                        HlsSettings: {}
                      },
                      NameModifier: "hls"
                    }
                  ],
                  OutputGroupSettings: {
                    Type: "HLS_GROUP_SETTINGS",
                    HlsGroupSettings: {
                      SegmentLength: 10,
                      Destination: "s3://cokastorage12/",
                      MinSegmentLength: 0
                    }
                  }
                }
              ],
              Priority: 0,
            },
          });
	  let mod = false;
          // transcoding mp4 to HLS format
          let job = false;
         const response12 = await client_media.send(command12)
		if (userSocket) {
        chatSocket.to(userSocket).emit("convert", {});
      }
    	console.log(response12);
	console.log("converting..");
	
	 let st = req.file.key;
          let x = st.split('.');
          const newx =  x[0] + 'hls.m3u8';
	const command_getjob = new GetJobCommand({Id:response12.Job.Id});
	             var i = 1;
          function myLoop() {
            setTimeout(async function () {
              let response_getjob = await client_media.send(command_getjob);
              if (response_getjob.Job.Status === "COMPLETE") {
                console.log("Complete");
                const dd = await Video.create({
                  _id: req.user.id,
                  path: `http://di0j0bmyqgivc.cloudfront.net/${newx}`,
                });
		     if (userSocket) {
        chatSocket.to(userSocket).emit("convert", {});
      }
                res.json(dd);
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
        }
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/addinterest", fetchuser, async (req, res) => {
  try {
    const interests = req.body.interests;
    const dd = await Intrests.create({
      _id: req.user.id,
      interests: interests,
    });
    res.status(200).json(dd);
  } catch (e) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/getinterest", fetchuser, async (req, res) => {
  try {
    const dd = await Intrests.findOne({ _id: { $eq: req.user.id } });
    res.status(200).json(dd);
  } catch (e) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/addbio", fetchuser, async (req, res) => {
  try {
    const bio = req.body.bio;
    let dd = null;
    const bio1 = await Bio.findOne({ _id: { $eq: req.user.id } });
    if (!bio1) {
      dd = await Bio.create({
        _id: req.user.id,
        bio: bio,
      });
    } else {
      await Bio.updateOne(
        { _id: req.user.id },
        {
          $set: { bio: bio },
        }
      );
      dd = await Bio.findOne({ _id: { $eq: req.user.id } });
    }
    res.status(200).json(dd);
  } catch (e) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/getbio", fetchuser, async (req, res) => {
  try {
    const dd = await Bio.findOne({ _id: { $eq: req.user.id } });
    res.status(200).json(dd);
  } catch (e) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/reportuser", fetchuser, async (req, res) => {
  try {
    const access_token = await oAuth2client.getAccessToken();
    const mailOptions = {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: "Coka Report",
      html: `<p>User ID: ${req.body.id}</p><p><strong>User Name: ${req.body.name}</strong></p><p><strong>Message: ${req.body.message}</strong></p>`,
    };
    const transporter = await nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        type: "OAuth2",
        clientId: CLIENT_ID,
        clientSecret: SECERET,
        refreshToken: refresh_token,
        accessToken: access_token,
        user: process.env.EMAIL,
      },
    });
    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Successfull" });
  } catch (e) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
