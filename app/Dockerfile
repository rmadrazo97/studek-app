# Stage 1: Dependencies
FROM node:20-alpine AS deps
# Install dependencies needed for SQLite (better-sqlite3 native compilation)
RUN apk add --no-cache libc6-compat python3 make g++ sqlite
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ sqlite
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
# Install SQLite runtime dependencies
RUN apk add --no-cache sqlite sqlite-libs
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy database library and migrations for runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations

# Copy cron worker and its dependencies
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/croner ./node_modules/croner
COPY --from=builder --chown=nextjs:nodejs /app/src/cron/worker.mjs ./cron-worker.mjs

# Copy startup script
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start-with-cron.sh ./start.sh
RUN chmod +x ./start.sh

# Copy source files needed for migrations (instrumentation runs from .next but needs these)
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db ./src/lib/db
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/auth ./src/lib/auth

# Set correct permissions
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/studek.db

# Start the application with cron worker
CMD ["sh", "./start.sh"]
