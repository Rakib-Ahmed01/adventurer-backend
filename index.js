require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = 'mongodb://localhost:27017';

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.get('/', (_req, res) => {
  res.send('Home Page');
});

async function connectDb() {
  const Destinations = client.db('Adventurer').collection('Destinations');
  const Reviews = client.db('Adventurer').collection('Reviews');

  app.get('/destinations', async (_req, res) => {
    const cursor = Destinations.find({});
    const destinations = await cursor.toArray();
    res.json(destinations);
  });

  app.get('/destinations-for-home', async (_req, res) => {
    const cursor = Destinations.find({}).sort({ time: -1 }).limit(3);
    const destinations = await cursor.toArray();
    res.json(destinations);
  });

  app.get('/destinations/:id', async (req, res) => {
    const id = req.params.id;
    const cursor = Destinations.find({ _id: ObjectId(id) });
    const destination = await cursor.toArray();
    res.json(destination);
  });
}

connectDb().catch((err) => console.log(err));

app.listen(port, () => {
  console.log('server is listening on port', +port);
});
