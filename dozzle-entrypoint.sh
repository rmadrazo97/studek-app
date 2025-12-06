#!/bin/sh
set -e

# Generate users.yml from environment variables
# Password is hashed with SHA-256 and base64 encoded
LOGS_USER="${LOGS_USERNAME:-admin}"
LOGS_PASS="${LOGS_PASSWORD:-admin}"

# Create SHA-256 hash of password (base64 encoded)
PASS_HASH=$(echo -n "$LOGS_PASS" | sha256sum | cut -d' ' -f1 | xxd -r -p | base64)

# Create data directory and users.yml
mkdir -p /data
cat > /data/users.yml << EOF
users:
  $LOGS_USER:
    password: "$PASS_HASH"
EOF

echo "Dozzle auth configured for user: $LOGS_USER"

# Start dozzle with simple auth
exec /dozzle --auth-provider simple
