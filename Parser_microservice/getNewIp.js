const axios = require("axios");
require("dotenv").config();

async function getNewIp() {
  let i;
  await axios.get("http://localhost:5000").then((res) => {
    res.data ? (i = res.data) : null;
  });

  return i;
}

module.exports = { getNewIp };
