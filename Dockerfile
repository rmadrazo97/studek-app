# Root Dockerfile for Railway deployment
# This builds the Next.js app from the app/ subdirectory

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ sqlite
WORKDIR /app

# Copy package files from app directory
COPY app/package.json app/package-lock.json* ./

# Install dependencies
RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ sqlite
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY app/ .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache sqlite sqlite-libs
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy database library and migrations for runtime
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder /app/migrations ./migrations

# Copy cron worker and its dependencies
COPY --from=builder /app/node_modules/croner ./node_modules/croner
COPY --from=builder /app/src/cron/worker.mjs ./cron-worker.mjs

# Copy startup script
COPY --from=builder /app/scripts/start-with-cron.sh ./start.sh
RUN chmod +x ./start.sh

# Copy source files needed for migrations
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/src/lib/auth ./src/lib/auth

# Railway injects PORT env var dynamically
EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/studek.db

# Start the application with cron worker
CMD ["sh", "./start.sh"]
