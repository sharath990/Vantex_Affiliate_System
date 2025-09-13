#!/bin/bash

# VPS Deployment Script
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Backend deployment
echo "📦 Deploying backend..."
cd WebService
npm ci --production

# Run database migrations if any
if [ -f "migrations/migrate.js" ]; then
    echo "🗄️ Running database migrations..."
    node migrations/migrate.js
fi

# Restart backend service
npx pm2 restart vantex-backend || npx pm2 start ecosystem.config.js

# Frontend deployment
echo "🎨 Deploying frontend..."
cd ../ReactClient
npm ci
npm run build

# Copy built files to web directory
sudo cp -r dist/* /var/www/html/

# Restart nginx
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"