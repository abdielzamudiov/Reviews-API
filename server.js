require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { json } = require('body-parser');

const dbUrl = process.env.MONGODB_URI;

//models
const Review = mongoose.model('Review',{
  user: String,
  review: String,
  track: String,
  date: Date,
});

const User = mongoose.model('User',{
  _id: String,
  password: String
});
//---------------

app.use(
  cors({  
    origin: 'http://localhost:3000',
  })  
);
app.use(express.json());

//---------------

// enpoint to add a review
app.post('/review',authenticateToken,async (req, res) => {
  try{
    const review = new Review(req.body);
    await review.save();
    res.sendStatus(201);
  }catch(error){
    res.sendStatus(500);
  }
});

//endpoint to update a review
app.put('/review',authenticateToken,async (req, res) => {
  const options = {
    new: true,
    useFindAndModify: false
  }
  try{
    if (req.user._id !== req.body.user)
      res.sendStatus(403);
    const result = await Review.findByIdAndUpdate(req.body._id,req.body, options);
    res.json(result);
  }catch(error){
    console.log(error.message);
    res.sendStatus(500);
  }
});

//endpoint to get all reviews of a single track
app.get('/reviews/:track', async (req, res) => {
  const reviews = await Review.find({ track: req.params.track }).sort({_id: -1});
  res.json(reviews);
});

//endpoint to get all the reviews
app.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({_id: -1});
    res.json(reviews);
  } catch(error){
    console.log(error.message);
  }
});

//endpoint to get a single review by id
app.get('/review/:reviewId', async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  res.json(review);
});

// endpoint to delete a review
app.delete('/review/:reviewId', authenticateToken, async (req, res) => {
  try {
    console.log(req.user, "deleting");
    const deleted = await Review.findByIdAndDelete(req.params.reviewId);
    res.sendStatus(200);
  } catch(error){
    console.log(error.message);
    res.sendStatus(500);
  }

});

//endpoint to get all the reviews of an user
app.get('/reviews/user/:userId',async (req, res) => {
  try {
    const reviews = await Review.find({user: req.params.userId}).sort({_id: -1});
    res.json(reviews);
  } catch (error) {
    console.log(error.message)
    res.sendStatus(500);
  }
})

// endpoint to sign in an user
app.post('/users/signin', async (req, res) => {
  try {
    const hashedPassword =  await bcrypt.hash(req.body.password, 10);
    const user = new User({ _id: req.body._id, password: hashedPassword});
    await user.save();
    res.sendStatus(201);
  } catch (error) {
      console.log(error.message);
      res.sendStatus(500);
  }
});

// endpoint to log in an user
app.post('/users/login', async (req, res) => {
  try {
    const user = await User.findById(req.body._id);
    if (!user)
      return res.sendStatus(404);
    if (await bcrypt.compare(req.body.password, user.password)){
      const accessToken = jwt.sign(JSON.stringify(user), process.env.ACCESS_TOKEN_SECRET);
      res.json({ 
        username: req.body._id,
        userToken: accessToken 
      });
    }
    else 
      res.sendStatus(401);
  } catch (error) {
    console.log(error.message);
    res.sendStatus(500);
  }
});

//Authentication Middleware
function authenticateToken (req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  token = decodeURI(token);
  if (token == null )
    return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
    if (error){
      console.log(error.message)
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  })
}

//Connection to mongodb thru mongoose
mongoose.connect(
  dbUrl,
  {useNewUrlParser: true, useUnifiedTopology: true},
  (error) => {
    console.log('mongodb connection ', error);
  }
);

app.listen(8080,()=>{
  console.log("server started on port 8080")
});