# Multi-stage build for security and smaller image size
FROM node:18-alpine AS base

# Install security updates and dumb-init
RUN apk update && apk upgrade && apk add --no-cache dumb-init curl

FROM base AS dependencies

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json .
COPY package-lock.json* .

# Install dependencies with security audit
RUN npm ci --only=production && npm audit --audit-level=moderate

FROM base AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application (if needed)
RUN npm run build

FROM base AS runner

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application and dependencies
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Install serve for production
RUN npm install -g serve

# Remove unnecessary files for security
RUN rm -rf /app/.env* && \
    rm -rf /app/*.md && \
    rm -rf /app/test* && \
    rm -rf /app/.git* && \
    rm -rf /app/src

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
