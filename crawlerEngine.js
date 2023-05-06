const dotenv = require("dotenv");
dotenv.config();
const { Page } = require("./Model");
const puppeteer = require("puppeteer");

// crawler function
crawlerEngine = async (url, maxDepth, ip) => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  try {
    const visitedUrls = new Set([url]);
    const linksToVisit = [url];
    let pageCount = 0;

    while (pageCount < maxDepth && linksToVisit.length > 0) {
      pageCount++;

      const currentUrl = linksToVisit.shift();
      const page = await browser.newPage();

      try {
        await page.goto(currentUrl);

        const title = await page.title();
        const header = await page.$eval("h1", (el) => el.textContent.trim());
        let linksOnPage = await page.$$eval("a", (anchors) =>
          anchors.map((anchor) => anchor.href)
        );

        function getUniqueUrls(urls) {
          return Array.from(new Set(urls));
        }

        linksOnPage = getUniqueUrls(linksOnPage);

        console.log(linksOnPage);

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

      await page.close();
    }

    await browser.close();
  } catch (error) {
    console.error(error, "@errorcRAWLER");
  } finally {
    await browser.close();
  }
};

module.exports = { crawlerEngine };
