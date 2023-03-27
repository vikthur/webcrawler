const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const crawler = require("./crawler");
const mongoose = require("mongoose");
const amqp = require("amqplib/callback_api");
const corsOptions = {
  origin: ["http://localhost:3000"],
  optionsSuccessStatus: 200,
};

const { pushToChannel } = require("./queue");

dotenv.config();

mongoose
  .connect(
    `mongodb+srv://victor_3d:${process.env.DB_PWD}@cluster0.9jmrg9q.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("db connection successful");
  })
  .catch((err) => console.log(err));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express());
app.use(cors(corsOptions));

let channel;
let TO_BE_VISITED_QUEUE = "urls_be_visited_queue";
let USER_UI_QUEUE = "user_ui_queue";

amqp.connect(process.env.AMPQ_URL, (err, connection) => {
  connection.createChannel((err, ch) => {
    channel = ch;
    console.log(err);
  });
  console.log(err);
});

app.post("/", async (req, res) => {
  pushToChannel(
    {
      url: req.body.url,
      title: "",
    },
    channel,
    TO_BE_VISITED_QUEUE
  );

  res.status(200).json({ message: "url published to queue successfully" });

  const startCrawlerEngine = (ch) => crawler(ch);
  startCrawlerEngine(channel);
});

app.listen(process.env.PORT_NUM, () => {
  console.log(`server is up and running  on ${process.env.PORT_NUM}`);
});

process.on("exit", (code) => {
  channel.close();
  console.log(`Closing rabbitmq channel`);
});

// STEPS
// post request from frontend@ server.js
// save to db via root schema@ server.js
// consume from queue,
// run validator function,
// run duplicate checker function,
// save to  db via url schema,
// consume from queue recursively,
// send to frontend,
// quit parser,
