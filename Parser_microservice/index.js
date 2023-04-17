const express = require("express")
const { crawlerEngine } = require("./crawlerEngine")
const app = express()
const { Page } = require("./Model")
const mongoose = require('mongoose');
const cors = require("cors")
const amqp = require('amqplib');

// rabbit mq connection string
const rabbitUrl =
  "amqps://abtelwui:Bihbk5TijVstBW0hMGUr_stRDimNbzqn@shrimp.rmq.cloudamqp.com/abtelwui";
// Connect to MongoDB
mongoose.connect("mongodb+srv://web_crawler:JY2UeSsoHDuntlEJ@cluster0.mnmpkso.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to database');
})
  .catch((err) => {
    console.error(err);
  })


  // cross origin access
app.use(cors())


//  route for solving  captcha
const captchaRouter = require("./capt");
app.use("/solve-captcha", captchaRouter);


// main route for starting the crawler
app.get("/", async (req, res) => {

  // collect user input for crawler 
  const url = req.query.url || "https://example.com";
  const depth = parseInt(req.query.depth) || 1;


  try {


    // calling the crawler function
    crawlerEngine( url, depth)

    // push the current ip the crawler will work with

    
    await amqp.connect(rabbitUrl).then(async (conn) => {
      await conn.createChannel().then(async (channel) => {
        const queueName = 'myQueue';

        await channel.assertQueue(queueName, { durable: false });


        // consuming ip from crawler 
        await channel.consume(queueName, (msg) => {
          const message = msg.content.toString();


          // sending the ip to the frontend 
          res.send({ ip: message, message: "crawler engine initiated" });

          console.log('Received message:', message);
        }, { noAck: true });
      });
    }).catch((err) => {
      console.error('Error connecting to RabbitMQ:', err);
    });

  } catch (error) {
    console.log(error)
  }


})


// get paginated result from the database 
app.get("/urls", async (req, res) => {

  const { page = 1, limit = 1 } = req.query;

  try {
    // find result based on req  query 
    const urls = await Page.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();


    res.json({
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      urls,
    });
  } catch (err) {
    console.error(err);
  }

})





// clearing mongodb  database
app.delete("/clear-database", async (req, res) => {
  try {
    // Clear all documents in the 
    await Page.deleteMany({});
    res.send('Database cleared successfully.');
  } catch (err) {
    res.status(500).send('Error clearing database.');
  }
})



app.listen(4000, () => {
  console.log("server running on port 4000")
})