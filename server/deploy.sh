#!/bin/bash
set -e

echo "=== Studek App Deployment Script ==="

# Update system packages
echo "Updating system packages..."
apt-get update

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt-get install -y nginx
fi

# Navigate to app directory
cd /root/studek-app/app

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the Next.js app
echo "Building the app..."
npm run build

# Copy Nginx configuration
echo "Configuring Nginx..."
cp /root/studek-app/server/nginx.conf /etc/nginx/sites-available/studek-app
ln -sf /etc/nginx/sites-available/studek-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

# Start/Restart the app with PM2
echo "Starting the app with PM2..."
pm2 stop studek-app 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "=== Deployment complete! ==="
echo "App is now available at: http://155.138.237.103"
