require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

const uri = 'mongodb://localhost:27017';

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Home Page');
});

async function connectDb() {
  const Destinations = client.db('Adventurer').collection('Destinations');

  app.get('/destinations', async (req, res) => {
    const cursor = Destinations.find({});
    const destinations = await cursor.toArray();
    res.json(destinations);
  });
}

connectDb().catch((err) => console.log(err));

app.listen(port, () => {
  console.log('server is listening on port', +port);
});
