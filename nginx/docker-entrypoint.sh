#!/bin/sh
# Nginx entrypoint with automatic SSL certificate management
set -e

DOMAIN="${DOMAIN:-studek.com}"
EMAIL="${SSL_EMAIL:-admin@studek.com}"
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

echo "============================================"
echo "Studek Nginx with Auto-SSL"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "============================================"

# Function to check if certificates exist and are valid
check_certificates() {
    if [ -f "$CERT_PATH/fullchain.pem" ] && [ -f "$CERT_PATH/privkey.pem" ]; then
        # Check if certificate is still valid (not expiring in next 30 days)
        if openssl x509 -checkend 2592000 -noout -in "$CERT_PATH/fullchain.pem" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Function to obtain SSL certificate
obtain_certificate() {
    echo "Obtaining SSL certificate for $DOMAIN..."

    # Create webroot directory
    mkdir -p /var/www/certbot

    # Request certificate using webroot method
    certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        --keep-until-expiring \
        --expand

    return $?
}

# Function to start certificate renewal daemon
start_renewal_daemon() {
    echo "Starting certificate renewal daemon..."
    while true; do
        sleep 12h
        echo "Checking for certificate renewal..."
        certbot renew --quiet --post-hook "nginx -s reload"
    done &
}

# Check if we should skip SSL (for local development)
if [ "$SKIP_SSL" = "true" ]; then
    echo "SKIP_SSL is set, running without SSL..."
    cp /etc/nginx/conf.d/http-only.conf /etc/nginx/conf.d/default.conf
    exec nginx -g "daemon off;"
fi

# Start nginx with HTTP-only config first (for ACME challenge)
echo "Starting Nginx with HTTP configuration..."
cp /etc/nginx/conf.d/http-only.conf /etc/nginx/conf.d/default.conf
nginx

# Wait for nginx to start
sleep 2

# Check if certificates already exist
if check_certificates; then
    echo "Valid SSL certificates found!"
else
    echo "No valid SSL certificates found, attempting to obtain..."

    # Try to obtain certificate
    if obtain_certificate; then
        echo "SSL certificate obtained successfully!"
    else
        echo "WARNING: Failed to obtain SSL certificate."
        echo "Site will remain HTTP-only until DNS is configured."
        echo "You can manually obtain certificates later with:"
        echo "  docker compose exec nginx certbot certonly --webroot -w /var/www/certbot -d $DOMAIN -d www.$DOMAIN"

        # Keep running with HTTP-only
        start_renewal_daemon
        wait
        exit 0
    fi
fi

# Switch to HTTPS config
echo "Switching to HTTPS configuration..."
cp /etc/nginx/conf.d/https.conf /etc/nginx/conf.d/default.conf

# Reload nginx with new config
nginx -s reload
echo "Nginx reloaded with HTTPS configuration!"

# Start renewal daemon
start_renewal_daemon

# Wait for nginx process
wait
