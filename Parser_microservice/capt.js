const puppeteer = require('puppeteer-extra');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
const express = require("express");
const app = express()
const router = express.Router()
const dotenv = require("dotenv");
const { upload } = require('./cloudinary');
dotenv.config();

router.get("/", (req, res) => {
    puppeteer.use(
        RecaptchaPlugin({
            provider: {
                id: '2captcha',
                token: '2f097ea32abd9f7934cfea6e047d08a1' // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
            },
            visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
        })
    )
    { }
    puppeteer.launch({ headless: false, timeout: 60000 }).then(async browser => {

        try {
            const page = await browser.newPage()
            await page.goto('https://www.google.com/recaptcha/api2/demo')

            await page.solveRecaptchas()

            await Promise.all([
                page.waitForNavigation(),
                page.click(`#recaptcha-demo-submit`)
            ])
            const screenshot = await page.screenshot({ path: 'response.png', fullPage: true, encoding: 'utf8' })
            const cloudFile = await upload("./response.png")
            res.status(200).json({ url: cloudFile.url })
            browser.close()
        } catch (error) {
            console.log(error)
        }



    })
})

module.exports = router



