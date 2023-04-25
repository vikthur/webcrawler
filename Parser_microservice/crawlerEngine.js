const { Page } = require("./Model");
const mongoose = require("mongoose");
const amqp = require("amqplib");
const axios = require("axios");
const { Cluster } = require("puppeteer-cluster");
const rabbitUrl =
  "amqps://abtelwui:Bihbk5TijVstBW0hMGUr_stRDimNbzqn@shrimp.rmq.cloudamqp.com/abtelwui";
// api key for ip rotation from scrapingbee.com
const scrapingBeeApiKey =
  "00QMWSF4QWATW8RYU76UUVZO0ZFXSLZGXNO3LRGC3JFERNTQ7W33L1VWGMCCNKFXQ6DF8ZIDDL4M1WR9";
// website for validating ip address
const Ipurl = "https://lumtest.com/myip.json";

const MAX_PAGES_TO_CRAWL = 5;

// crawler function
crawlerEngine = async (url, maxDepth) => {
  try {
    // Connect to MongoDB

    try {
      await mongoose
        .connect(
          "mongodb+srv://web_crawler:JY2UeSsoHDuntlEJ@cluster0.mnmpkso.mongodb.net/?retryWrites=true&w=majority",
          {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          }
        )
        .then(() => {
          console.log("Connected to database");
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (error) {
      console.log(error);
    }

    //  depth
    let depth = 0;
    const urls = [];
    // making a request to scrapingbee.com for new ip
    // const response = await axios.get(
    //   `https://app.scrapingbee.com/api/v1?url=${Ipurl}&api_key=${scrapingBeeApiKey}&render_js=false&session_id=${Math.ceil(
    //     Math.random() * 10000000
    //   )}`
    // );

    // new ip gotten from scraping bee
    // const Ip = response.data.ip || "0000000000";
    const Ip = "12363723.3283";

    try {
      // sending  IP to  the frontend
      await amqp
        .connect(rabbitUrl)
        .then(async (conn) => {
          await conn.createChannel().then(async (channel) => {
            const queueName = "myQueue";

            await channel.assertQueue(queueName, { durable: false });

            channel.sendToQueue(queueName, Buffer.from(Ip));

            console.log("Ip sent:", Ip);
          });
        })
        .catch((err) => {
          console.error("Error connecting to RabbitMQ:", err);

          // res.status(500).send("Error publishing message to RabbitMQ");
        });
    } catch (error) {
      console.log(error, "error");
    }

    // initialising puppeteer cluster
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 1,
      monitor: true,
      puppeteerOptions: {
        headless: true,
        args: [
          // `--proxy-server =${`http://${Ip} `}`,
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
      },
    });
    let pageCount = 0;
    // per task
    await cluster.task(async ({ page, data: url }) => {
      const visitedUrls = new Set([url]);
      const linksToVisit = [url];
      while (pageCount < MAX_PAGES_TO_CRAWL && linksToVisit.length > 0) {
        pageCount++;

        const currentUrl = linksToVisit.shift();

        try {
          await page.goto(currentUrl);

          const linksOnPage = await page.$$eval("a", (anchors) =>
            anchors.map((anchor) => anchor.href)
          );

          const title = await page.title();
          const header = await page.$eval("h1", (el) => el.textContent.trim());
          // const urls = await page.$$eval("a", (links) =>
          //   links.map((a) => a.href)
          // );

          console.log(header, "HEADER");
          console.log(title, "TITLE");
          // console.log(urls, "urls", nums++);

          console.log(linksOnPage, linksToVisit);

          // const pageDoc = new Page({
          //   url,
          //   title,
          //   header,
          //   urls,
          // });
          // await pageDoc.save();

          linksOnPage.forEach((link) => {
            if (!visitedUrls.has(link)) {
              visitedUrls.add(link);
              linksToVisit.push(link);
            }
          });
        } catch (error) {
          console.error(`Error while crawling ${currentUrl}: ${error.message}`);
        }

        console.log(`Current page: ${pageCount}`);
      }
    });

    console.log(url, "url");

    await cluster.queue(url);

    await cluster.idle();
    await cluster.close();
  } catch (error) {
    console.error(error);
  }
};

module.exports = { crawlerEngine };

// (async () => {
//   const cluster = await Cluster.launch({
//     concurrency: Cluster.CONCURRENCY_CONTEXT,
//     maxConcurrency: 10,
//   });

//   let pageCount = 0;

//   await cluster.task(async ({ page, data: url }) => {
//     const visitedUrls = new Set([url]);
//     const linksToVisit = [url];

//     while (pageCount < MAX_PAGES_TO_CRAWL && linksToVisit.length > 0) {
//       pageCount++;

//       const currentUrl = linksToVisit.shift();

//       try {
//         await page.goto(currentUrl);

//         const linksOnPage = await page.$$eval("a", (anchors) =>
//           anchors.map((anchor) => anchor.href)
//         );

//         console.log(linksOnPage);

//         linksOnPage.forEach((link) => {
//           if (!visitedUrls.has(link)) {
//             visitedUrls.add(link);
//             linksToVisit.push(link);
//           }
//         });
//       } catch (error) {
//         console.error(`Error while crawling ${currentUrl}: ${error.message}`);
//       }

//       console.log(`Current page: ${pageCount}`);
//     }
//   });

//   await cluster.queue("https://www.example.com");

//   await cluster.idle();
//   await cluster.close();
// })();
