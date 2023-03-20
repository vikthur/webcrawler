require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();

app.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://api.ipify.org/?format=json", {
      proxy: {
        protocol: "http",
        host: "proxy.scrapingbee.com",
        port: 8886,
        auth: {
          username: process.env.API_KEY,
          password: "render_js=False&premium_proxy=True",
        },
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "server error" });
  }
});

app.listen(process.env.PROXY_MICROSERVICE_PORT, () =>
  console.log(
    `proxy server is running on port ${process.env.PROXY_MICROSERVICE_PORT}!`
  )
);
