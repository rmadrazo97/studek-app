# Nginx with Certbot for automatic SSL
FROM nginx:alpine

# Install certbot and openssl
RUN apk add --no-cache \
    certbot \
    certbot-nginx \
    openssl \
    bash

# Create directories
RUN mkdir -p /var/www/certbot /etc/letsencrypt

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/http-only.conf /etc/nginx/conf.d/http-only.conf
COPY conf.d/https.conf /etc/nginx/conf.d/https.conf
COPY conf.d/http-only.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
