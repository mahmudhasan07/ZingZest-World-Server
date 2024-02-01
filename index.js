const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()

const port = process.env.PORT || 2000
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  res.send('Welcome to my Server')
})





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.mongoDB_user}:${process.env.mongoDB_pass}@cluster0.oqk84kq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const addItem = client.db('zingzest-world').collection('add-items')
    const seller_user = client.db('zingzest-world').collection('seller-users')


    await client.connect();

    // ! Post Method





    // ! Seller Section

    // * Get Section 

    app.get("/seller-users", async (req, res) => {
      const result = await seller_user.find().toArray()
      res.send(result)
    })
    app.get("/seller-users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { email: id }
      const user = await seller_user.findOne(query)
      res.send(user)
    })

    app.get("/search/:data", async (req, res) => {
      const data = req.params.data
      console.log(data);
      const query = {$or:[{brand : {$regex: data, $options : "i"}},{ categoryType : {$regex: data, $options : "i"}},{ name : {$regex: data, $options : "i"}}]}
      // const query1 = {categoryType : {$regex: data, $options : "i"}}
      const searchResult = await addItem.find(query).toArray()
      res.send(searchResult)
    })

    app.get("/items", async (req, res) => {
      const id = req.query
      // console.log(id);
      let query
      if (id?.data != "undefined" && id.data) {
        // console.log("hello");
        query = { userEmail: id.data }
      }
      const result = await addItem.find(query).toArray()

      res.send(result)
    })


    app.get("/items/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const item = await addItem.findOne(query)
      res.send(item)

    })

    // * Post Section

    app.post("/seller-users", async (req, res) => {
      const data = req.body
      console.log(data);
      const result = await seller_user.insertOne(data)
      res.send(result)

    })

    app.post("/addItem", async (req, res) => {
      const data = req.body
      console.log(data);
      const result = await addItem.insertOne(data)
      res.send(result)
    })

    // * Update Section

    app.put("/seller-users", async (req, res) => {
      const data = req.body
      const query = { email: data?.email }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          name: data.name, number: data.number, address: data.address, image: data.hostImage
        }
      }

      const result = await seller_user.updateOne(query, updateDoc, options)
      res.send(result)
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Server is running at ${port}`);
})
