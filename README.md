# webCrawler_backend

SYSTEM DESIGN OF WEB CRAWLER

    Technologies to be used:
       Docker
       Aws
       Nodejs
       RabbitMq for queue manager
       Puppeeter for web scraper
       Redis as low latency persistent storage

    Functional components of web crawler

Proxy Function:
-publish new ip address for new request

Connector Function:
-recieve root url
-call Proxy Function.
-push intial or root url to queue.

Parser Function:
-consume root url from queue.
-call Validator function.
-scrape out urls from Root url.
-call Duplicate checker function.
-save url found to Queue.
-save url to persistent storage e.g Redis.

Validator Function:

- check persistent storage if url has been visited.
- return boolean

Duplicate Checker Function:

- Take in an array of url as argument.
- return an array without duplicate.

Client Function:

- stream urls to the user interface.
- call pagination handler.

Captcha Function:

- solve Captchas

FLOWCHART OF WEBCRAWLER
