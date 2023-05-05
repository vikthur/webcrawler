const { Page } = require("./Model");
const mongoose = require("mongoose");

const amqp = require("amqplib");
const axios = require("axios");
const { Cluster } = require("puppeteer-cluster");

// const rabbitUrl =
//     "amqps://abtelwui:Bihbk5TijVstBW0hMGUr_stRDimNbzqn@shrimp.rmq.cloudamqp.com/abtelwui";

// crawler function
crawlerEngine = async (url, maxDepth) => {
    try {
        //  depth 
        let depth = 0;


        // making a request to scrapingbee.com for new ip 
        const response = await axios.get(
            `https://app.scrapingbee.com/api/v1?url=${process.env.IPURL}&api_key=${process.env.SCRAPING_BEE_API_KEY}&render_js=false&session_id=${Math.ceil(
                Math.random() * 10000000
            )}`
        );

        // new ip gotten from scraping bee
        const Ip = response.data.ip;

            // initialising puppeteer cluster 
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 2,
            puppeteerOptions: {
                headless: false,
                args: [
                    `--proxy-server =${`http://${Ip} `}`,
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                ],
            },
        });

        cluster.task(async ({ page, data }) => {
            const { url, taskDepth } = data;

            await page.goto(url);

            const title = await page.title();
            const header = await page.$eval("h1", (el) => el.textContent.trim());
            let urls = await page.$$eval("a", (links) => links.map((a) => a.href));
            urls = [...new Set(urls.filter((url) => url.startsWith("http")))];

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
            

            // maxdepth is the user specified input 
            // Recursively crawl each newly discovered URL, but only if the current depth is less than the maximum depth
            if (taskDepth < maxDepth) {
                for (const newUrl of urls) {
                    cluster.queue({ url: newUrl, taskDepth: taskDepth + 1 });
                }
            }
        });



        cluster.queue({ url, taskDepth: depth });


        await cluster.idle();
        await cluster.close();
    } catch (error) {
        console.log("There is error")
        console.error(error);
    }
};

// crawlerEngine("https://www.example.com/", 3)

module.exports = { crawlerEngine };

// crawlerEngine('https://example.com', 1);
