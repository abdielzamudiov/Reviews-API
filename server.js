const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const dbUrl = 'mongodb+srv://abdiel:pet-project@pet-project.k1oxe.mongodb.net/pet-project?retryWrites=true&w=majority';

const Review = mongoose.model('Review',{
  user: String,
  review: String,
  track: String,
  date: Date,
})

app.use(
  cors({  
    origin: 'http://localhost:3000',
  })  
);
app.use(express.json());
app.get('/hello', (req, res) => {
  res.json("hello world");
});

app.post('/review',async (req, res) => {
  try{
    const review = new Review(req.body);
    const savedMessage = await review.save();
    res.sendStatus(200);
  }catch(error){
    res.sendStatus(500);
  }

});

app.get('/reviews/:track', async (req, res) => {
  const reviews = await Review.find({ track: req.params.track });
  res.json(reviews);
});

app.get('/review/:reviewId', async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  res.json(review);
});

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