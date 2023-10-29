const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mv9nczj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("parlourDb").collection("users");
    const servicesCollection = client.db("parlourDb").collection("services");
    const bookedCollection = client.db("parlourDb").collection("booked");
    const reviewsCollection = client.db("parlourDb").collection("reviews");
    // post or get user by email api
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // get user role by email api
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // Get all Services api
    app.get("/services", async (req, res) => {
      const services = await servicesCollection.find().toArray();
      res.send(services);
    });
    // Get all Single Services api
    app.get("/services/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const service = await servicesCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!service) {
          return res.status(404).json({ error: "Service not found" });
        }

        res.json(service);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Post Booked Service api
    app.post("/booked", async (req, res) => {
      const newService = req.body;
      const result = await bookedCollection.insertOne(newService);
      res.json(result);
    });

    // Get all Booked Services api
    app.get("/booked", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await bookedCollection.find(query).toArray();
      res.send(result);
    });

    // Add a new service api
    app.post("/services", async (req, res) => {
      const newService = req.body;
      const result = await servicesCollection.insertOne(newService);
      res.json(result);
    });

    // Get all Reviews api
    app.get("/reviews", async (req, res) => {
      const reviews = await reviewsCollection.find().toArray();
      res.send(reviews);
    });
    // Post Reviews api
    app.post("/reviews", async (req, res) => {
      const newReview = req.body;
      const result = await reviewsCollection.insertOne(newReview);
      res.json(result);
    });

    // .......................................................
    // Admin api
    // Get all service Orders api
    app.get("/orders", async (req, res) => {
      const result = await bookedCollection.find().toArray();
      res.send(result);
    });

    // Update service Order Status api
    app.put("/orders/:id", async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { status: status },
      };
      const result = await bookedCollection.updateOne(query, updateDoc);
      res.json(result);
    });

    // Edit a Service (PUT)
    app.put("/services/:id", async (req, res) => {
      const { id } = req.params;
      const updatedService = req.body;

      try {
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: updatedService, // Use $set to update fields other than _id
        };

        const result = await servicesCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Service not found" });
        }

        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Delete a Service (DELETE)
    app.delete("/services/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const query = { _id: new ObjectId(id) };
        const result = await servicesCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Service not found" });
        }

        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // .......
    // Make a user an admin
    app.put("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const query = { email: email };
        const updateDoc = {
          $set: { role: "admin" }, // Set the user role to "admin"
        };
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Remove admin role from a user
    app.put("/users/remove-admin/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const query = { email: email };
        const updateDoc = {
          $set: { role: "user" }, // Set the user role back to "user"
        };
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // .......................................................

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Parlour app running");
});

app.listen(port, () => {
  console.log(`Parlour server is running on port: ${port}`);
});
