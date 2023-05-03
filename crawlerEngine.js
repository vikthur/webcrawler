const dotenv = require("dotenv");
dotenv.config();
const { Page } = require("./Model");
let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}
// crawler function
crawlerEngine = async (url, maxDepth, ip) => {
  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  let browser = await puppeteer.launch(options);

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
