const crawlerEngine = require("./crawlerEngine");
const { Page } = require("./Model");
const cors = require("cors");
const { solveRecaptcha } = require("./updated_captcha");
const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const app = require("express")();
const PORT = process.env.PORT || 5000;

let chrome = {};
let puppeteer;

// if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
chrome = require("chrome-aws-lambda");
puppeteer = require("puppeteer-core");
// } else {
//   puppeteer = require("puppeteer");
// }

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

  try {
    const response = await axios.get(
      `https://app.scrapingbee.com/api/v1?url=${process.env.IPURL}&api_key=${
        process.env.SCRAPING_BEE_API_KEY
      }&render_js=false&session_id=${Math.ceil(Math.random() * 10000000)}`
    );

    // calling the crawler function
    await crawlerEngine(url, depth, response.data.ip);

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
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
