const axios = require("axios");
require("dotenv").config();

async function getNewIp() {
  let IP;
  await axios.get("http://localhost:5000").then((res) => {
    res.data ? (IP = res.data) : null;
  });

  return IP;
}

module.exports = { getNewIp };
