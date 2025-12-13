#!/bin/sh
# Start script that runs both Next.js app and the cron worker

echo "======================================"
echo "Studek - Starting App + Cron Worker"
echo "======================================"

# Start the cron worker in the background
echo "[Start] Launching cron worker..."
node /app/cron-worker.mjs &
CRON_PID=$!
echo "[Start] Cron worker started with PID: $CRON_PID"

# Handle shutdown
cleanup() {
    echo "[Start] Shutting down..."
    kill $CRON_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the Next.js app (foreground)
echo "[Start] Launching Next.js app..."
exec node /app/server.js
