FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev

COPY package.json package-lock.json ./
RUN npm ci --build-from-source

# Copy source code only (exclude node_modules, dist, *.db files)
COPY src/ ./src/

EXPOSE 3001

CMD ["node", "src/index.js"]
