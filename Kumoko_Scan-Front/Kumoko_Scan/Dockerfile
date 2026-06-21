FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --quiet && apk add --no-cache dos2unix && find /usr/src/app/node_modules/.bin -type f -exec dos2unix {} +

COPY . .

EXPOSE 5173

ENV PATH=/usr/src/app/node_modules/.bin:$PATH
CMD ["node", "./node_modules/vite/bin/vite.js", "--host", "0.0.0.0"]