FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE $PORT

CMD sh -c "PORT=${PORT:-8000} node server.js"
