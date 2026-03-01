FROM node:20-slim

WORKDIR /app

# Install production dependencies only (faster, smaller image)
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application source
COPY . .

# 8081 — WebSocket server
# 8082 — Express HTTP health-check endpoint
EXPOSE 8081 8082

CMD ["node", "server.js"]
