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
- push root url to queue
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
