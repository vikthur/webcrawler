const axios = require("axios");
require("dotenv").config();

async function getNewIp() {
  let IP;
  try {
    await axios.get("http://localhost:5000").then((res) => {
      res.data ? (IP = res.data) : null;
    });
  } catch (error) {
    console.log(error);
  }

  return IP;
}

module.exports = { getNewIp };
