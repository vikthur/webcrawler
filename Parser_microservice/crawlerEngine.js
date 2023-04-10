const { Page } = require("./Model");
const mongoose = require("mongoose");
const scrapingBeeApiKey =
    "00QMWSF4QWATW8RYU76UUVZO0ZFXSLZGXNO3LRGC3JFERNTQ7W33L1VWGMCCNKFXQ6DF8ZIDDL4M1WR9";
const axios = require("axios");
const Ipurl = "https://lumtest.com/myip.json";
const amqp = require("amqplib");
const rabbitUrl =
    "amqps://abtelwui:Bihbk5TijVstBW0hMGUr_stRDimNbzqn@shrimp.rmq.cloudamqp.com/abtelwui";
crawlerEngine = async (CLUSTER, url, maxDepth, status) => {
    try {
        // Connect to MongoDB
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

        // depth 
        let depth = 0;

        const response = await axios.get(
            `https://app.scrapingbee.com/api/v1?url=${Ipurl}&api_key=${scrapingBeeApiKey}&render_js=false&session_id=${Math.ceil(
                Math.random() * 10000000
            )}`
        );
        // ip
        const Ip = response.data.ip;

        // send IP
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

        const cluster = await CLUSTER.launch({
            concurrency: CLUSTER.CONCURRENCY_CONTEXT,
            maxConcurrency: 1,
            puppeteerOptions: {
                headless: true,
                args: [
                    `--proxy-server =${`http://${Ip} `}`,
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                ],
            },
        });

        cluster.task(async ({ page, data: url }) => {


            await page.goto(url);


            const title = await page.title();
            const header = await page.$eval("h1", (el) => el.textContent.trim());
            const urls = await page.$$eval("a", (links) => links.map((a) => a.href));

            console.log(header);
            console.log(title)
            console.log(urls)

            // Create a new page document and save it to the database
            const pageDoc = new Page({
                url,
                title,
                header,
                urls,
            });
            await pageDoc.save();

            // Recursively crawl each newly discovered URL, but only if the current depth is less than the maximum depth
            if (depth < maxDepth) {
                for (const newUrl of urls) {
                    cluster.queue(newUrl);
                }
            }
        });



        cluster.queue(url);


        await cluster.idle();
        await cluster.close();
    } catch (error) {
        console.error(error);
    }
};

// crawlerEngine("https://www.example.com/", 3)

module.exports = { crawlerEngine };

// crawlerEngine('https://example.com', 1);
