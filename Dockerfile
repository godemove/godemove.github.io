# syntax=docker/dockerfile:1

# Stage 1: Build the static site with Bun
FROM oven/bun:1.3.11-slim AS builder
WORKDIR /app

# Copy dependency files first for layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code and build
COPY . .
RUN bun run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:1.25-alpine-slim AS runner

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for clean URLs (Astro static output)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
