const { Page } = require("./Model");
const { Cluster } = require("puppeteer-cluster");

// crawler function
crawlerEngine = async (url, maxDepth, ip) => {
  try {
    // initialising puppeteer cluster
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 1,
      monitor: false,
      puppeteerOptions: {
        headless: true,
        args: [
          `--proxy-server =${`http://${ip} `}`,
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
      while (pageCount < maxDepth && linksToVisit.length > 0) {
        pageCount++;

        const currentUrl = linksToVisit.shift();

        try {
          await page.goto(currentUrl);

          const linksOnPage = await page.$$eval("a", (anchors) =>
            anchors.map((anchor) => anchor.href)
          );

          const title = await page.title();
          const header = await page.$eval("h1", (el) => el.textContent.trim());

          console.log(header, "HEADER");
          console.log(title, "TITLE");
          console.log(linksOnPage, "LINKS_ON_PAGE");
          const pageDoc = new Page({
            url,
            title,
            header,
            linksOnPage,
          });
          await pageDoc.save();

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

    await cluster.queue(url);

    await cluster.idle();
    await cluster.close();
  } catch (error) {
    console.error(error, "@errorcRAWLER");
  }
};

module.exports = { crawlerEngine };
