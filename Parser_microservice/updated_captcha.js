const puppeteer = require("puppeteer");
const Captcha = require("2captcha");

async function scrapePage(url) {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto(url);

  const dataSiteKeys = await page.$$eval("[data-sitekey]", (elements) =>
    elements.map((element) => element.getAttribute("data-sitekey"))
  );

  const solver = new Captcha.Solver("2f097ea32abd9f7934cfea6e047d08a1");

  await solver
    .recaptcha(dataSiteKeys.toString(), url)

    .then(async (res) => {
      console.log(res);

      //   const gRecaptchaResponseElement = await page.$("#g-recaptcha-response");
      const gRecaptchaResponseElement = await page.evaluateHandle(() =>
        document.getElementById("g-recaptcha-response")
      );
      await gRecaptchaResponseElement.evaluate(
        (element, value) => (element.value = value),
        res.data
      );

      await page.$eval("#recaptcha-demo-submit", (el) => el.click());
    });

  //   await browser.close();

  console.log(dataSiteKeys);

  return dataSiteKeys;
}

// Example usage:
const url = "https://www.google.com/recaptcha/api2/demo";
scrapePage(url)
  .then((dataSiteKeys) => console.log(dataSiteKeys))
  .catch((error) => console.error(error));
