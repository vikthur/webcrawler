const { Cluster } = require("puppeteer-cluster");
const stringParser = require("./helperFunctions/stringParser");
const useProxy = require("puppeteer-page-proxy");
const dbManager = require("./helperFunctions/dBConnection");
// const dbManager = require("./helperFunctions/dBConnection");
// const validateUrlsNotVisited = require("./helperFunctions/validator");

const crawler = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 2,
    monitor: true,
    retryLimit: 1,
    puppeteerOptions: {
      headless: false,
      defaultViewport: false,
    },
    skipDuplicateUrls: true,
  });
  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });
  await cluster.task(async ({ page, data: url }) => {
    await page.goto(url);

    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      await useProxy(request, {
        proxy: "proxy.scrapingbee.com",
        url: "https://api.ipify.org/?format=json",
        port: 8886,
        auth: {
          username: process.env.API_KEY,
          password: "render_js=False&premium_proxy=True",
        },
      });
    });

    page.setDefaultNavigationTimeout(0);

    const pageTitle = await page.evaluate(() => document.title);
    console.log(`Page title is ${pageTitle}`);

    let rawHtml = await page.evaluate(() => document.body.innerHTML);
    let htmlTextContent = await page.evaluate(() => document.body.textContent);
    let urls = stringParser.urlParser(rawHtml);
    urls = stringParser.urlIncludesHTTPS(urls);
    console.log(htmlTextContent, "htmlTextContent");
    console.log(urls, "result");
  });

  // consume from queue
  // validate the urls from db
  // await cluster.queue(u);

  // remove duplicate urls
  // save to db
  // publish to frontend socket

  await cluster.idle();
  await cluster.close();
};

module.exports = crawler;
