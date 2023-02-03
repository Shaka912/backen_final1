const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const users = require("../models/users");
const Places = require("../models/places");
const admin = require("../models/admin");
const fetchadmin = require('../middleware/fetchadmin')
const jwt_secrect = "totot1232";

//creating admin
router.post(
  "/createadmin",
  [
    body("username", "please enter a valid username").exists(),
    body("password", "password must be at least 5characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let user = await admin.findOne({ username: req.body.username });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry The username is already is taken" });
      }
      const salt = await bcrypt.genSalt(10);
      const secpass = await bcrypt.hash(req.body.password, salt);

      user = await admin.create({
        password: secpass,
        username: req.body.username,
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
    body("username", "Please enter valid username").exists(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    //error checking
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(403).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    try {
      let user = await admin.findOne({ username: username });
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
      res.cookie("authtoken", authtoken, { httpOnly: true });
      res.json({ authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error has occured");
    }
  }
);
//dashboard
router.get("/dashboard", (req, res) => {
  res.render("dashboard");
});
// users
router.get("/users", async (req, res) => {
  //const user = [{ name: 'Alice' }, { name: 'Bob' }];
  const user = await users.findOne({});
  console.log(user.name);
  res.render("users", { user });
});

//adding places using post
router.post(
  "/addplace",
  [
    body("image", "please enter a image url").exists(),
    body("title", "password must be at least 5characters").isLength({
      min: 3,
    }),
    body("description", "description must be at least 5 characters").isLength({
      min: 5,
    }),
    body("price", "please enter price").exists(),
  ],
  fetchadmin,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { image, title, description, price } = req.body;
      const plac = new Places({
        image,
        title,
        description,
        price,
      });
      const save = await plac.save();
      res.json(save);
    } catch (error) {
      console.log(error);
      res.status(500).send("some error has accored");
    }
  }
);
// route for displaying property

// endpoint for getting data and displaying in website

router.get("/getplaces",fetchadmin, async (req, res) => {
  try {
    const places = await Places.find({});
    res.json(places);
  } catch (error) {
    console.log(error);
  }
});

// route for updating places
router.put("/updateplace/:id",fetchadmin
, async (req, res) => {
  //const { title, description, image, price } = req.body;
  const title = req.body.title;
  const description = req.body.description
  const image = req.body.image;
  const price  = req.body.price
  //create a new listing array
  const newplace = {};
  try {
    
    if (title) {
      newplace.title = title;
    }
    if (description) {
      newplace.description = description;
    }
    if (image) {
      newplace.image = image;
    }
    if (price) {
      newplace.price = price;
    }
    //find the listing to updated and update it
    let place = await Places.findById(req.params.id);
    console.log(place)
    if (!place) {
      return res.status(404).send("Not Found");
    }
    place = await Places.findByIdAndUpdate(
      req.params.id,
      { $set: newplace },
      { new: true }
    );
    res.json(newplace)
  } catch (error) {
    console.log(error)
    res.status(500).send("some error has accored");
  }
 
});

//route for deleting the listing
router.delete("/deleteplace/:id",fetchadmin, async (req, res) => {
  try {
    //find the listing to be deleted and delete it
  let place = Places.findById(req.params.id);
  if (!place) {
    return res.status(404).send("Not Found");
  }
  place = await Places.findByIdAndDelete(
    req.params.id,
   
  );
  res.send("Successfully deleted")
  } catch (error) {
    console.log(error);
      res.status(500).send("some error has accored");
  }
});
//route for deleting A user
router.delete("/deleteuser/:id",fetchadmin, async (req, res) => {
  try {
    //find the user to delete and delete it
  let user = users.findById(req.params.id);
  if (!user) {
    return res.status(404).send("Not Found");
  }
  user = await users.findByIdAndDelete(
    req.params.id,
    
  );
  res.send("Successfully deleted")
  } catch (error) {
    console.log(error);
      res.status(500).send("some error has accored");
  }
});
module.exports = router;
