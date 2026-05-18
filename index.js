const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

// Mongo run() function
async function run() {
  try {

    await client.connect();

    const db = client.db('doc-appoint-a9');
    const appointmentCollection = db.collection('appointments');

    // all appointments
    app.get('/appointments', async (req, res) => {
      const result = await appointmentCollection.find().toArray();
      res.json(result)
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