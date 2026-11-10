FROM node:22-alpine3.22

RUN apk upgrade --no-cache \
    && npm install -g npm@latest \
    && npm cache clean --force

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY src ./src

USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
