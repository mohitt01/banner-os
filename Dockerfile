# BannerOS Unified Server Dockerfile
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY api/package.json api/package-lock.json ./api/
COPY dashboard/package.json dashboard/package-lock.json ./dashboard/
COPY docs/package.json docs/package-lock.json ./docs/
COPY mcp-server/package.json mcp-server/package-lock.json ./mcp-server/

# Install all dependencies
RUN npm run ci:all

# Copy source code
COPY . .

# Build frontend assets with dynamic BASE_URL replacement
ARG BASE_URL=https://your-domain.com
ENV BASE_URL=$BASE_URL
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 banneros

# Copy built assets and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/api ./api
COPY --from=builder /app/mcp-server ./mcp-server
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dashboard/dist ./dashboard/dist
COPY --from=builder /app/docs/.vitepress/dist ./docs/.vitepress/dist
COPY --from=builder /app/docs/pages ./docs/pages
COPY --from=builder /app/package.json ./package.json

# Create data directory for SQLite
RUN mkdir -p /app/data && chown banneros:nodejs /app/data

# Switch to non-root user
USER banneros

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]
