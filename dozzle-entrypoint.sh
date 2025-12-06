#!/bin/sh
set -e

# Generate users.yml from environment variables
LOGS_USER="${LOGS_USERNAME:-admin}"
LOGS_PASS="${LOGS_PASSWORD:-admin}"

# Create SHA-256 hash of password (hex format - what Dozzle expects)
PASS_HASH=$(printf '%s' "$LOGS_PASS" | sha256sum | cut -d' ' -f1)

# Create data directory and users.yml
mkdir -p /data
cat > /data/users.yml << EOF
users:
  - username: "$LOGS_USER"
    password: "$PASS_HASH"
EOF

echo "Dozzle auth configured for user: $LOGS_USER"

# Start dozzle with simple auth
exec /dozzle --auth-provider simple
