const puppeteer = require("puppeteer");
const Captcha = require("2captcha");
const { upload } = require("./cloudinary");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
async function solveRecaptcha(url, ip, res) {
  try {
    const response = await axios.get(
      `https://app.scrapingbee.com/api/v1?url=${process.env.IPURL}&api_key=${
        process.env.SCRAPING_BEE_API_KEY
      }&render_js=false&session_id=${Math.ceil(Math.random() * 10000000)}`
    );

    console.log(response);
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--proxy-server =${`http://${response.data.ip} `}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
      ignoreHTTPSErrors: true,
      executablePath: puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 640,
      height: 480,
      deviceScaleFactor: 1,
    });
    await page.goto(url);

    // Find all input fields on the page
    const inputs = await page.$$("input");

    // Fill each input field with random text
    for (const input of inputs) {
      const randomText = Math.random().toString(36).substring(2, 15);
      await input.type("a" + randomText + "@gmail.com");
    }

    // Check all checkboxes on the page
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      await checkbox.click();
    }

    // Select the first radio input on the page
    const radioButtons = await page.$$('input[type="radio"]');
    if (radioButtons.length > 0) {
      await radioButtons[0].click();
    }

    const dataSiteKeys = await page.$$eval("[data-sitekey]", (elements) =>
      elements.map((element) => element.getAttribute("data-sitekey"))
    );

    const solver = new Captcha.Solver("2f097ea32abd9f7934cfea6e047d08a1");

    await solver
      .recaptcha(dataSiteKeys.toString(), url)

      .then(async (res) => {
        console.log(res);

        const gRecaptchaResponseElement = await page.evaluateHandle(() =>
          document.getElementById("g-recaptcha-response")
        );
        await gRecaptchaResponseElement.evaluate(
          (element, value) => (element.value = value),
          res.data
        );
      });

    await page.keyboard.press("Enter");
    await page.waitForNavigation();

    const screenshot = await page.screenshot({
      path: "response.png",
      // fullPage: true,
      encoding: "utf8",
    });

    const cloudFile = await upload("response.png");

    // await browser.close();
    return cloudFile.url;
  } catch (e) {
    console.log(e);
  }
  // finally {
  //   await browser.close();
  // }
}

module.exports = { solveRecaptcha };
