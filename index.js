const express = require("express");
const { crawlerEngine } = require("./crawlerEngine");
const app = express();
const { Page } = require("./Model");
const cors = require("cors");
const { solveRecaptcha } = require("./updated_captcha");
const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error(err);
  });

app.use(cors());

// web_crawler_endpoint
app.get("/", async (req, res) => {
  const url = req.query.url || "https://example.com";
  const depth = parseInt(req.query.depth) || 10;

  console.log(url, "url");

  try {
    const response = await axios.get(
      `https://app.scrapingbee.com/api/v1?url=${process.env.IPURL}&api_key=${
        process.env.SCRAPING_BEE_API_KEY
      }&render_js=false&session_id=${Math.ceil(Math.random() * 10000000)}`
    );

    // calling the crawler function
    crawlerEngine(url, depth, response.data.ip);

    res.status(200).json({ message: "crawler_started", ip: response.data.ip });
  } catch (error) {
    console.log(error);
  }
});

// get paginated result from the database
app.get("/urls", async (req, res) => {
  const { page = 1, limit = 1 } = req.query;

  try {
    // find result based on req  query
    const urls = await Page.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Page.countDocuments();

    res.json({
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      urls,
    });
  } catch (err) {
    console.error(err);
  }
});

// clearing mongodb  database
app.delete("/clear-database", async (req, res) => {
  try {
    // Clear all documents in the
    await Page.deleteMany({});
    res.send("Database cleared successfully.");
  } catch (err) {
    res.status(500).send("Error clearing database.");
  }
});

app.get("/recaptcha_demo", async (req, res) => {
  const { rootUrl } = req.query;
  try {
    const url = await solveRecaptcha(rootUrl, res);
    console.log(url);
    res.send(url);
  } catch (error) {
    console.log(error);
  }
});

app.listen(5000, () => {
  console.log("server running on port 5000");
});
