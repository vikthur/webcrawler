const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const dbManager = require("./helperFunctions/dBConnection");
const crawler = require("./crawler");
const corsOptions = {
  origin: ["http://localhost:3000"],
  optionsSuccessStatus: 200,
};

dotenv.config();
const app = express();
dbManager.connectToDb();
app.use(cors());
app.use(express.json());
app.use(express());
app.use(cors(corsOptions));

const Switch = true;

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

app.post("/", async (req, res) => {
  try {
    // saves starting url to database
    dbManager.saveToDb(req.body);
  } catch (err) {
    res.status(500).json({ error: err, messsage: "server error" });
    console.log(err);
  }
});

// publish starting url to url queue

// call crawlerEngine
crawler();

// initialize frontend socket

// consume from url queue to socket

app.listen(process.env.PORT_NUM, () => {
  console.log(`server is up and running  on ${process.env.PORT_NUM}`);
});
