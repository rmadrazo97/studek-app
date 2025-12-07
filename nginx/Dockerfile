# Nginx with Certbot for automatic SSL
FROM nginx:alpine

# Install certbot and openssl
RUN apk add --no-cache \
    certbot \
    certbot-nginx \
    openssl \
    bash

# Create directories
RUN mkdir -p /var/www/certbot /etc/letsencrypt /etc/nginx/templates

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
# Only copy templates - entrypoint.sh will copy the active config to default.conf
COPY conf.d/http-only.conf /etc/nginx/templates/http-only.conf
COPY conf.d/https.conf /etc/nginx/templates/https.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
