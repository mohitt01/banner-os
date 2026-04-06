FROM node:20-alpine

WORKDIR /app

# Copy mcp-server package
COPY mcp-server/package.json mcp-server/package-lock.json ./mcp-server/
RUN cd mcp-server && npm ci

# Copy mcp-server source and widgets
COPY mcp-server/src/ ./mcp-server/src/
COPY mcp-server/widgets/ ./mcp-server/widgets/

# Copy docs/pages and docs/skill (needed by knowledge.js and get_skill tool)
COPY docs/pages/ ./docs/pages/
COPY docs/skill/ ./docs/skill/

WORKDIR /app/mcp-server

EXPOSE 3002

CMD ["node", "src/index.js"]
