FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Copy source code only (exclude node_modules, dist, *.db files)
COPY src/ ./src/

EXPOSE 3001

CMD ["node", "src/index.js"]
