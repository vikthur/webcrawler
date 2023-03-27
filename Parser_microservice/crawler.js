const { Cluster } = require("puppeteer-cluster");
const stringParser = require("./helperFunctions/stringParser");
const useProxy = require("puppeteer-page-proxy");
const { pushToChannel } = require("./queue");
let TO_BE_VISITED_QUEUE = "urls_be_visited_queue";
let USER_UI_QUEUE = "user_ui_queue";

const crawler = async (channel) => {
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

  // handling error in puppeteer cluster
  cluster.on("taskerror", (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });
  await cluster.task(async ({ page, data: url }) => {
    try {
      // going the the url
      await page.goto(url);

      // proxy connection for rotating ip for each url request
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

      // get the raw html contents including url links and text content from the url
      let rawHtml = await page.evaluate(() => document.body.innerHTML);

      // getting the textcontent only
      let htmlTextContent = await page.evaluate(
        () => document.body.textContent
      );

      // getting the links from the raw html
      let URLS = stringParser.urlParser(rawHtml);

      // extract useful and non duplicate keyword sentences from the text content
      function extractMeaningfulSentences(text) {
        text = text.substring(100, 30);
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
        text = text.replace(/<[^>]+>|[^\w\s]|_/g, "");
        text = text.replace(/\s+/g, " ");
        const sentences = text.split(/[.?!]/g);
        const meaningfulSentences = sentences.filter((sentence) => {
          sentence = sentence.trim();
          if (!/\w/.test(sentence)) {
            return false;
          }
          const words = sentence.split(/\s+/g);
          if (words.length < 3) {
            return false;
          }
          return true;
        });
        const uniqueSentences = Array.from(new Set(meaningfulSentences));
        return uniqueSentences.toString();
      }

      // getting the page title
      const pageTitle = await page.evaluate(() => document.title);
      htmlTextContent = extractMeaningfulSentences(htmlTextContent);
      URLS = stringParser.urlIncludesHTTPS(URLS);

      const textArray = [];
      const pageTitleArray = [];

      textArray.push(htmlTextContent);
      pageTitleArray.push(pageTitle);

      URLS.forEach((url) => {
        const schema = {
          url: "",
          title: "",
        };
        schema.url = url;
        pageTitleArray.forEach((title) => (schema.title = title));

        // run validator function
        // run duplicate checker function here
        console.log(schema, "objschema");
        pushToChannel(schema, channel, TO_BE_VISITED_QUEUE);
      });
    } catch (error) {
      console.log(error);
    }
  });

  // this is where the crawler consume the starting url from the queue
  await channel.assertQueue(TO_BE_VISITED_QUEUE, { durable: false });
  await channel.consume(
    TO_BE_VISITED_QUEUE,
    (message) => {
      let content = [];
      let contentArray = [];
      content = message.content.toString();
      content = JSON.parse(content);
      contentArray.push(content);
      contentArray.forEach((url) => cluster.queue(url.url));
    },
    { noAck: true }
  );

  await cluster.idle();
  await cluster.close();
};

module.exports = crawler;
