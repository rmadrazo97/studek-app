#!/bin/sh
set -e

# Generate users.yml from environment variables using Dozzle's built-in generate command
LOGS_USER="${LOGS_USERNAME:-admin}"
LOGS_PASS="${LOGS_PASSWORD:-admin}"

# Create data directory
mkdir -p /data

# Use Dozzle's built-in generate command to create properly formatted users.yml with bcrypt hash
# This ensures compatibility with Dozzle 5.x+ which requires bcrypt passwords
/dozzle generate "$LOGS_USER" --password "$LOGS_PASS" --name "$LOGS_USER" > /data/users.yml

echo "Dozzle auth configured for user: $LOGS_USER"

# Start dozzle with simple auth
exec /dozzle --auth-provider simple
