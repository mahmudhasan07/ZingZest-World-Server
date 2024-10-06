const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 2000
app.use(cors({
  origin: ["http://localhost:5173", "https://seller-zingzest.web.app","https://client-zingzest-world.netlify.app", "https://client-zingzest.web.app", "http://localhost:5174"],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get('/', async (req, res) => {
  res.send('Welcome to our Server')
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

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token
  // console.log("paise",token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorize User" })
  }
  jwt.verify(token, 'secret', async (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Unauthorize wrong User" })
    }
    else {
      req.user = decoded
      next()
    }
  })
}

async function run() {
  try {
    const addItem = client.db('zingzest-world').collection('add-items')
    const seller_user = client.db('zingzest-world').collection('seller-users')
    const client_user = client.db('zingzest-world').collection('client-users')
    const client_buyProduct = client.db('zingzest-world').collection('client-buyProduct')
    const client_cartProduct = client.db('zingzest-world').collection('client-cartProduct')
    const product_review = client.db('zingzest-world').collection('product-review')

    // await client.connect();

    // ! Client Section

    // * GET Section
    app.get('/client-users/:email', async (req, res) => {
      const email = req.params.email
      const query = { email: email }
      const data = await client_user.findOne(query)
      res.send(data)
    })

    app.get("/my-orders", async (req, res) => {
      const data = req.query.data
      // console.log(data);
      let query
      if (data) {
        query = { buyer: data }
      }

      const result = await client_buyProduct.find(query).toArray()
      res.send(result)

    })

    app.get("/comments", async (req, res) => {
      const result = await product_review.find().toArray()
      res.send(result)
    })

    app.get('/comments/:id', async (req, res) => {
      const id = req.params.id
      const query = { id: id }
      const result = await product_review.find(query).toArray()
      res.send(result)
    })

    app.get("/carts/:email", async (req, res) => {
      const email = req.params.email
      const query = { userID: email }
      const result = await client_cartProduct.find(query).toArray()
      res.send(result)
    })




    // * Post section

    app.post("/buy-items", async (req, res) => {
      const data = req.body
      // console.log(data);
      const result = await client_buyProduct.insertOne(data)
      res.send(result)
    })

    app.post("/carts", async (req, res) => {
      const data = req.body
      // console.log(data);
      const result = await client_cartProduct.insertOne(data)
      res.send(result)

    })

    app.post("/client-users", async (req, res) => {
      const data = req.body
      const email = data?.email
      if (email) {
        const user = { email: email }
        const result = await client_user.findOne(user)
        if (result) {

          res.send("Already Registration")
        }
        else {
          const result = await client_user.insertOne(data)
          res.send(result)
        }
      }

    })

    app.post("/comments", async (req, res) => {
      const data = req.body
      // console.log(data);
      const result = await product_review.insertOne(data)
      res.send(result)
    })

    // * Patch Section

    app.patch("/items/:id", async (req, res) => {
      const data = req.body.totalReview
      const id = req.params.id
      const options = { upsert: true }
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          review: data
        }
      }
      const result = await addItem.updateOne(filter, updateDoc, options)
      res.send(result)

    })
    app.patch("/updateItem", async (req, res) => {
      const data = req.body
      const id = data?.idNumber
      const quantity = data?.finalQuantity
      const options = { upsert: true }
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          quantity: quantity
        }
      }
      const result = await addItem.updateOne(filter, updateDoc, options)
      res.send(result)

    })

    // * Delete section

    app.delete("/delete-card/:id", async (req, res) => {
      const id = req.params
      const query = { _id: new ObjectId(id.id) }
      const result = await client_cartProduct.deleteOne(query)
      res.send(result)
    })





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
      const data1 = req.query.data
      // console.log(data1);
      let filter
      if (data1 == "sorta-b") {
        filter = { price: 1 }
      }
      if (data1 == "sortb-a") {
        filter = { price: -1 }
      }
      if (data1 == "toprating") {
        filter = { review: -1 }
      }

      // const query = { $or: [{ brand: { $regex: data, $options: "i" } }, { categoryType: { $regex: data, $options: "i" } }, { name: { $regex: data, $options: "i" } }] }
      const query = {categoryType : {$regex:data, $options : "i"}}
      const searchResult = await addItem.find(query).sort(filter).toArray()
      res.send(searchResult)
    })

    app.get("/items", async (req, res) => {
      const id = req.query.data
      let filter
      if (id == "toprating") {
        filter = { review: -1 }
      }
      const query = { review: { $exists: true } }
      // const query = {price :{$gte:4000 , $lte: 5000}} //ekhne range use korle aevabe korte hbe normal range kaj kore na..

      const result = await addItem.find(query).sort(filter).toArray()
      res.send(result)
    })

    app.get("/discount/:id", async (req, res) => {
      const id = req.params.id
      const filter = { category: id }
      const result = await addItem.find(filter).toArray()
      res.send(result)
    })

    app.get("/items/:email", verifyToken, async (req, res) => {
      const email = req.params.email
      const data = req.query.data
      let sortData
      if (data == "sorta-b") {
        sortData = { pAddTime: 1 }
        // console.log("sorta-b");  
      }
      if (data == "sortb-a") {
        sortData = { pAddTime: -1 }
        // console.log("sortb-a");
      }
      const query = { userEmail: email }
      // console.log(req?.user);
      if (email == req?.user?.userEmail) {
        const itemData = await addItem.find(query).sort(sortData).toArray()
        res.send(itemData)
      }
      else {
        return res.status(403).send({ message: "unAuthorize" })
      }
    })


    app.get("/item/:id", async (req, res) => {
      const id = req.params.id
      // console.log(id);
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
      // console.log(data);
      const result = await addItem.insertOne(data)
      res.send(result)
    })

    // * Update Section

    app.patch("/seller-users", async (req, res) => {
      const data = req.body
      // console.log(data);
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



    // * Delete Section 

    app.delete("/delete-item/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await addItem.deleteOne(query)
      res.send(result)
    })


    // ! JWT section

    app.post("/jwt", async (req, res) => {
      const data = req.body
      // console.log(data);
      const token = jwt.sign(data, 'secret', { expiresIn: 60 * 60 });
      // console.log(token);
      res
        .cookie("token", token, {
          httpOnly: false,
          secure: true,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
        })
        .send(token)
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
