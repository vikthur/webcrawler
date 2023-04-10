const express = require("express")
const { crawlerEngine } = require("./crawlerEngine")
const app = express()
const { Page } = require("./Model")
const mongoose = require('mongoose');
const cors = require("cors")
const amqp = require('amqplib');
const { Cluster } = require("puppeteer-cluster");

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

app.use(cors())


const captchaRouter = require("./capt");
app.use("/solve-captcha", captchaRouter);

let STOP_CRAWLER_STATUS = false

// get user input 
app.get("/", async (req, res) => {
  const url = req.query.url || "https://example.com";
  const depth = parseInt(req.query.depth) || 1;
  STOP_CRAWLER_STATUS = false
  try {
    crawlerEngine(Cluster, url, depth)
    await amqp.connect(rabbitUrl).then(async (conn) => {
      await conn.createChannel().then(async (channel) => {
        const queueName = 'myQueue';

        await channel.assertQueue(queueName, { durable: false });

        await channel.consume(queueName, (msg) => {
          const message = msg.content.toString();

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


// get paginated result
app.get("/urls", async (req, res) => {

  const { page = 1, limit = 1 } = req.query;

  try {
    const urls = await Page.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Page.countDocuments();

    res.json({
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      urls,
      count
    });
  } catch (err) {
    console.error(err);
  }

})



//  stop  crawler Engine
app.post("/stop-engine", async (req, res) => {
  try {

    Cluster.close().then(() => {
      console.log('STOP_ENGINE')
      process.exit(0);
    });
    res.send("engine stopped successful");
  } catch (err) {
    res.status(500).send('Error stopping engine.');
  }
})


// clear database
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