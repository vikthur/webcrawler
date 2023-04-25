const { Cluster } = require("puppeteer-cluster");

const MAX_PAGES_TO_CRAWL = 10;

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 10,
  });

  let pageCount = 0;

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

        console.log(linksOnPage);

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

  await cluster.queue("https://www.example.com");

  await cluster.idle();
  await cluster.close();
})();
