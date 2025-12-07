#!/bin/bash
# SSL Setup Script for studek.com
# Run this on the server after DNS is configured

set -e

DOMAIN="studek.com"
EMAIL="${1:-admin@studek.com}"

echo "==================================="
echo "SSL Setup for $DOMAIN"
echo "==================================="

# Check if DNS is pointing to this server
echo "Checking DNS resolution..."
RESOLVED_IP=$(dig +short $DOMAIN | head -1)
SERVER_IP=$(curl -s ifconfig.me)

if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    echo "WARNING: DNS for $DOMAIN resolves to $RESOLVED_IP"
    echo "This server's IP is $SERVER_IP"
    echo "Make sure DNS is configured correctly before proceeding."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to project directory
cd ~/studek-app

# Step 1: Start nginx without SSL first
echo ""
echo "Step 1: Starting services..."
docker compose up -d nginx app

# Wait for nginx to be healthy
echo "Waiting for nginx to start..."
sleep 5

# Step 2: Obtain SSL certificate
echo ""
echo "Step 2: Obtaining SSL certificate..."
docker compose run --rm certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email

# Step 3: Update nginx config for HTTPS
echo ""
echo "Step 3: SSL certificate obtained!"
echo ""
echo "Now you need to update the nginx config to enable HTTPS:"
echo "1. Edit nginx/conf.d/default.conf"
echo "2. Comment out the HTTP proxy section"
echo "3. Uncomment the 'return 301' redirect"
echo "4. Uncomment the entire HTTPS server block"
echo ""
echo "Then restart nginx:"
echo "  docker compose restart nginx"
echo ""
echo "==================================="
echo "SSL Setup Complete!"
echo "==================================="
