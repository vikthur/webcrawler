const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const crawler = require("./crawler");
const mongoose = require("mongoose");
const amqp = require("amqplib/callback_api");
dotenv.config();
const corsOptions = {
  origin: ["http://localhost:3000"],
  optionsSuccessStatus: 200,
};
const { pushToChannel } = require("./queue");

// const dburi = process.env.MONGODB_URL;
// connection to mongodb
// console.log(dburi, "hjddh");
mongoose
  .connect(
    "mongodb+srv://victor_3d:BjbzHC3IblZArs0q@cluster0.9jmrg9q.mongodb.net/webCrawler?retryWrites=true&w=majority",
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("db connection successful");
  })
  .catch((err) => console.log(err));

let channel;
let TO_BE_VISITED_QUEUE = "urls_be_visited_queue";
let USER_UI_QUEUE = "user_ui_queue";

// connection to rabbitmq
amqp.connect(process.env.AMPQ_URL, (err, connection) => {
  connection.createChannel((err, ch) => {
    channel = ch;
    console.log(err);
  });
  console.log(err);
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express());
app.use(cors(corsOptions));

// request to recieve starting from frontend
app.post("/", async (req, res) => {
  // pushes it to the queue
  pushToChannel(
    {
      url: req.body.url,
      title: "",
    },
    channel,
    TO_BE_VISITED_QUEUE
  );

  // send response of url published to queue
  res.status(200).json({ message: "url published to queue successfully" });

  // start crawler engine, pass the  queueing channel as argument
  const startCrawlerEngine = (ch) => crawler(ch);
  startCrawlerEngine(channel);
});

app.listen(process.env.PORT_NUM, () => {
  console.log(`server is up and running  on ${process.env.PORT_NUM}`);
});

// on process exit, terminate rabbitmq connection
process.on("exit", (code) => {
  channel.close();
  console.log(`Closing rabbitmq channel`);
});

// post from frontend with the starting url.
// starting url will be published to the queue(rabbitmq)
// call the validator function to check the database for ready  urls
//  the function of the validator function to prevent
// the engine crawler consumed from the queue.
// filter the content gotten the url e.g urls, text content.
// call or run duplicate checker function to remove duplicate urls.
// save the urls gotten  from the root url .
// push the url to the queue to scraped again
// result pushed to the user_UI_frontend.
