FROM node:20-slim AS base

RUN apt-get update && apt-get install -y curl xz-utils && \
    curl -fsSL https://github.com/typst/typst/releases/latest/download/typst-x86_64-unknown-linux-musl.tar.xz \
    | tar -xJ --strip-components=1 -C /usr/local/bin --wildcards '*/typst' && \
    apt-get purge -y curl xz-utils && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["node", "dist/server.js"]
