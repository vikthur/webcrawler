function urlParser(html) {
  const regex = /<a[^>]+href="([^"]+)"/g;
  const links = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    links.push(match[1]);
  }
  return links;
}
function urlIncludesHTTPS(arr) {
  const regex = /https/i;
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    if (regex.test(arr[i])) {
      result.push(arr[i]);
    }
  }

  return result;
}

function objSchema(url, textContent, pageTitle) {
  const schema = console.log(schema, "schema");
  return schema;
}

module.exports = { urlParser, urlIncludesHTTPS, objSchema };
