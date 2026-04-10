FROM node:24-alpine

WORKDIR /app

# Copy docs package and install
COPY docs/package.json ./docs/
RUN cd docs && npm install

# Copy docs source + pages + skill + config
COPY docs/ ./docs/

WORKDIR /app/docs

EXPOSE 3003

CMD ["npx", "vitepress", "dev", "--host", "0.0.0.0", "--port", "3003"]
