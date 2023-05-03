FROM ghcr.io/puppeteer/puppeteer:19.7.5

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/user/bin/google-chrome-stable

WORKDIR /user/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "index.js" ]

