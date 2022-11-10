require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.ht2ef7a.mongodb.net/?retryWrites=true&w=majority`;

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
    const cursor = Destinations.find({}).sort({ _id: -1 }).limit(3);
    const destinations = await cursor.toArray();
    res.json(destinations);
  });

  app.get('/destinations/:id', async (req, res) => {
    const id = req.params.id;
    const cursor = Destinations.find({ _id: ObjectId(id) });
    const destination = await cursor.toArray();
    res.json(destination);
  });

  app.post('/destinations/', async (req, res) => {
    const destination = req.body;
    const result = await Destinations.insertOne(destination);
    res.json(result);
  });

  app.get('/my-reviews', verifyToken, async (req, res) => {
    const { email } = req.query;
    if (email !== req?.user?.email) {
      console.log('forbidden');
      return res
        .status(403)
        .json({ success: false, message: 'Forbidden Access!' });
    }
    const cursor = Reviews.find({ email: email }).sort({ time: -1 });
    const reviews = await cursor.toArray();
    res.json({ success: true, reviews });
  });

  app.get('/all-reviews', async (req, res) => {
    const cursor = Reviews.find();
    const reviews = await cursor.toArray();
    res.json(reviews);
  });

  app.get('/reviews/:id', async (req, res) => {
    const cursor = Reviews.find({ serviceId: req.params?.id }).sort({
      time: -1,
    });
    const review = await cursor.toArray();
    res.json(review);
  });

  app.get('/update-review/:id', async (req, res) => {
    const { id } = req.params;
    const review = await Reviews.findOne({ _id: ObjectId(id) });
    res.json(review);
  });

  app.post('/reviews/:id', async (req, res) => {
    const { id } = req.params;
    const review = req.body;
    const filter = { _id: ObjectId(id) };
    const update = await Destinations.updateOne(filter, {
      $inc: { reviewCount: 1 },
    });
    const result = await Reviews.insertOne(review);
    res.json(result);
  });

  app.post('/login', (req, res) => {
    const user = req.body;
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN);
    res.json({ accessToken });
  });

  app.patch('/reviews/:id', async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const result = await Reviews.updateOne(
      { _id: ObjectId(id) },
      { $set: { reviewText: text } }
    );
    res.json(result);
  });

  app.delete('/reviews/:id', async (req, res) => {
    const { id } = req.params;
    const { serviceId } = req.query;
    await Destinations.updateOne(
      { _id: ObjectId(serviceId) },
      {
        $inc: { reviewCount: -1 },
      }
    );
    const result = await Reviews.deleteOne({ _id: ObjectId(id) });
    res.json(result);
  });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized!' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Unauthorized!' });
    }
    req.user = user;
    next();
  });
}

connectDb().catch((err) => console.log(err));

app.listen(port, () => {
  console.log('server is listening on port', +port);
});
