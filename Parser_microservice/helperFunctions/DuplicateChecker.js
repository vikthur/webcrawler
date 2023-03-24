// recieve an array of urls and returns an array without duplicate.
const dbManager = require("./dBConnection");
const removeDuplicate = (payLoad) => {
  let result;
  // fetch  compareUrls params b from db
  const dbUrls = dbManager.getAll();
  result = compareUrls(payLoad, dbUrls);

  return result;
};

module.exports = removeDuplicate;

function compareUrls(a, b) {
  const notFoundUrls = [];
  for (let i = 0; i < a.length; i++) {
    if (b.indexOf(a[i]) === -1) {
      notFoundUrls.push(a[i]);
    }
  }
  return notFoundUrls;
}
