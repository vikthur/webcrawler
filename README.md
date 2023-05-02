# webCrawler_backend

SYSTEM DESIGN OF WEB CRAWLER

    Technologies to be used:
       Docker
       Aws
       Nodejs
       RabbitMq for queue manager
       Puppeeter for web scraper
       Mongodb as low latency persistent storage

    Architecture of web crawler

Proxy Server Microservice:
-publish new ip address for new request
-push intial or root url to queue.

Parser Microservice:
-request ip from proxy server microservice.
-consume root url from queue.
-call Validator function.
-scrape out urls from Root url.
-call Duplicate checker function.
-save url found to Queue.
-save url to persistent storage e.g mongodb

Client Microservice:

- collect root url from user request.
- post root url to parser microservice (initiate program).
- stream urls to the user interface.
- call pagination handler.

Captcha Microservice:

- solve Captchas

Validator Function:

- check persistent storage if url has been visited.
- return boolean

Duplicate Checker Function:

- Take in an array of url as argument.
- return an array without duplicate.

// post from frontend with the starting url.
// starting url will be published to the queue(rabbitmq)
// call the validator function to check the database for ready urls
// the function of the validator function to prevent
// the engine crawler consumed from the queue.
// filter the content gotten from the url e.g urls, text content.
// call or run duplicate checker function to remove duplicate urls.
// save the urls gotten from the root url.
// push the url to the queue to scraped again.
// result pushed to the user_UI_frontend.

PARSER_MICROSERVICE_PORT = 5003
API_KEY = 00QMWSF4QWATW8RYU76UUVZO0ZFXSLZGXNO3LRGC3JFERNTQ7W33L1VWGMCCNKFXQ6DF8ZIDDL4M1WR9

# PORT_NUM = 4000
