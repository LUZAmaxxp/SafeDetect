# =============================================================================
# SafeDetect Dashboard — Two-stage production build
# Stage 1: Build the React app with webpack
# Stage 2: Serve the static bundle with nginx
# =============================================================================

# --- Build stage ---
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# --- Production stage ---
FROM nginx:alpine

# Copy compiled assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (provides WS proxy and SPA fallback)
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
