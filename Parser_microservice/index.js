const express = require("express");
const amqp = require("amqplib");
const puppeteer = require("puppeteer");
const { Cluster } = require("puppeteer-cluster");
const app = express();
const cors = require("cors");
// Connect to RabbitMQ and create the queue
const queue = "urls_be_visited_queue";
let connection;
let channel;
async function mq() {
  try {
    connection = await amqp.connect(
      "amqps://abtelwui:Bihbk5TijVstBW0hMGUr_stRDimNbzqn@shrimp.rmq.cloudamqp.com/abtelwui"
    );
    console.log("rabbit connected");
    channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });
  } catch (err) {
    console.error(err);
  }
}

mq();

app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  })
);
app.use(cors());
app.use(express.json());
app.use(express());

// Set up route to accept website URL and crawling depth from frontend
app.post("/", async (req, res) => {
  console.log("recieving url");
  // global variables
  let results = [];
  const websiteUrl = req?.body?.url;

  // Set up Puppeteer cluster
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 1, // number of workers
  });

  // Push the initial URL to the queue
  console.log("Push the initial URL to the queue");
  try {
    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify({ url: websiteUrl }))
    );
  } catch (error) {
    console.log(error);
  }

  // Consume messages from the queue
  console.log(" Consume messages from the queue");

  try {
    if (!channel && !channel.isOpen()) return;

    channel.consume(
      queue,
      async (msg) => {
        const { url } = JSON.parse(msg.content.toString());
        // channel.ack(msg);

        try {
          // Use Puppeteer cluster to crawl the URL
          console.log("Use Puppeteer cluster to crawl the URL");
          const result = await cluster.execute(url, async ({ page }) => {
            if (url === "" || null) return;
            console.log("visiting the url.......");
            // visiting the url
            await page.goto(url);
            // getting the url title
            const title = await page.title();
            // getting the page link
            const linksFound = await page.$$eval("a", (a) =>
              a.map((l) => l.href)
            );
            console.log("collecting links.......");

            return { url, title, linksFound };
          });

          console.log("pushing links.......to array");
          results.push(result);
        } catch (err) {
          console.error(err);
        }

        if (results.length === 1) {
          console.log("sending result.......as response");
          res.status(200).send(results);
          await cluster.close();
          console.log("channel closed");
        }
      },
      { noAck: true }
    );
  } catch (err) {
    console.error(err);
    await cluster.close();
    await channel.close();
    await connection.close();
    return res
      .status(500)
      .json({ error: "Error consuming messages from queue" });
  }
});

app.listen(4000, () => {
  console.log("Server listening on port 4000");
});
