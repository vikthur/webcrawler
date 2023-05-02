const puppeteer = require("puppeteer");
const Captcha = require("2captcha");
const { upload } = require("./cloudinary");
async function solveRecaptcha(url, res) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server =${`http://${ip} `}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
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
    // console.log(dataSiteKeys);
    // console.log(cloudFile.url);
    await browser.close();
    res.send(cloudFile.url);
    return cloudFile.url;
  } catch (e) {
    console.log(e);
  }
}

module.exports = { solveRecaptcha };

// Example usage:
// const url = "https://app.scrapingbee.com/account/register";

// const url = "https://recaptcha-demo.appspot.com/recaptcha-v2-checkbox.php";
// solveRecaptcha(url)
//   .then((dataSiteKeys) => console.log(dataSiteKeys))
//   .catch((error) => console.error(error));
