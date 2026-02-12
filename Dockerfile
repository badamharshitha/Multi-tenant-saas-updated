FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache postgresql-client

COPY package*.json ./
RUN npm install --production

COPY . .

RUN chmod +x init-db.sh

EXPOSE 5000

CMD ["sh", "init-db.sh"]
