#!/bin/bash

# VPS Deployment Script for Ubuntu 22.04
echo "Starting VPS deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install SQLite (lightweight alternative to SQL Server)
sudo apt install sqlite3 -y

# Create app directory
sudo mkdir -p /var/www/vantex
sudo chown -R $USER:$USER /var/www/vantex

echo "System setup complete!"
echo "Next: Upload your project files to /var/www/vantex"