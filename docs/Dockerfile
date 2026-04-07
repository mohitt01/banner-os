FROM node:24-alpine

WORKDIR /app

# Copy docs package and install
COPY docs/package.json ./docs/
RUN cd docs && npm install

# Copy docs source + pages + skill
COPY docs/ ./docs/

# Copy mcp-server README (needed by @mcp alias)
COPY mcp-server/README.md ./mcp-server/README.md

WORKDIR /app/docs

EXPOSE 3003

CMD ["npx", "vite", "--host", "0.0.0.0"]
