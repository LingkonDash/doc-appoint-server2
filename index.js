const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const app = express();

dotenv.config();
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI

app.use(cors());
app.use(express.json());


// Mongo client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/jwks`)
);

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWKS);

    req.user = payload;

    next();

  } catch (e) {
    console.log(e);

    return res.status(403).json({
      message: "Forbidden",
    });
  }
};

// Mongo run() function
async function run() {
  try {

    await client.connect();

    const db = client.db('doc-appoint-a9');
    const appointmentCollection = db.collection('appointments');
    const bookingCollection = db.collection('bookings');

    // get all appointments
    app.get('/appointments', async (req, res) => {
      const result = await appointmentCollection.find().toArray();
      res.json(result)
    })

    // get single appointments
    app.get('/appointments/:id', verifyToken, async (req, res) => {
      const { id } = req.params

      const result = await appointmentCollection.findOne({ id: id })
      res.json(result)
    })

    // post bookings
    app.post('/bookings', verifyToken, async (req, res) => {
      const bookingData = req.body
      const result = await bookingCollection.insertOne(bookingData);
      res.json(result);
    })

    // update booking
    app.patch('/bookings/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const filter = { _id: new ObjectId(id) };

      const result = await bookingCollection.updateOne(filter, { $set: updatedData });
      res.json(result);
    })

    // delete booking
    app.delete('/bookings/:id', verifyToken, async (req, res) => {

      const { id } = req.params;

      const filter = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(filter);
      res.json(result);
    });

    // get bookings by uid 
    app.get('/bookings/:uid', verifyToken, async (req, res) => {
      const { uid } = req.params

      const result = await bookingCollection.find({ userID: uid }).toArray();
      res.json(result);
    })

    // featured doctors
    app.get('/featuredDoc', async (req, res) => {

      const result = await appointmentCollection.find().sort({ "rating.average": -1 }).limit(3).toArray();

      res.json(result);
    });

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run();


app.get('/', (req, res) => {
  res.send('server is running fine!')
})

app.listen(port, () => {
  console.log('server is running on port', port)
})