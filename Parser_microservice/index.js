const { getNewIp } = require("./getNewIp");

let proxyServer = getNewIp();
proxyServer
  .then((result) => {
    if (result) {
      console.log(result, "IP");
    }
  })
  .catch((err) => {
    console.error(err);
  });
