# VisitorVault - Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Production Environment Requirements](#production-environment-requirements)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [SSL/HTTPS Configuration](#sslhttps-configuration)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Backup Strategy](#backup-strategy)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All tests passing (`php artisan test`)
- [ ] Code reviewed and approved
- [ ] Environment variables configured for production
- [ ] Database migrations tested
- [ ] Frontend built without errors (`npm run build`)
- [ ] API endpoints tested
- [ ] Security review completed
- [ ] Dependencies updated to stable versions

### Infrastructure

- [ ] Production server provisioned
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Database server ready
- [ ] Backup solution in place
- [ ] Monitoring tools configured

---

## Production Environment Requirements

### Server Specifications

#### Minimum Requirements
- **CPU**: 1 vCPU
- **RAM**: 2GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS (recommended) or similar

#### Recommended Requirements
- **CPU**: 2+ vCPUs
- **RAM**: 4GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### Software Requirements

- **Web Server**: Nginx 1.18+ or Apache 2.4+
- **PHP**: 8.2+
- **Database**: MySQL 8.0+ or PostgreSQL 13+
- **Node.js**: 18+ (for building frontend)
- **SSL**: Let's Encrypt or commercial certificate
- **Supervisor**: For queue workers (optional)
- **Redis**: For caching and sessions (optional)

---

## Backend Deployment

### 1. Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y software-properties-common

# Add PHP repository
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 and extensions
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common \
    php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl \
    php8.2-zip php8.2-gd php8.2-bcmath php8.2-redis

# Install Nginx
sudo apt install -y nginx

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### 2. Deploy Laravel Application

```bash
# Create application directory
sudo mkdir -p /var/www/visitvault
sudo chown $USER:$USER /var/www/visitvault

# Clone repository
cd /var/www/visitvault
git clone <repository-url> .
cd backend

# Install dependencies
composer install --optimize-autoloader --no-dev

# Set permissions
sudo chown -R www-data:www-data /var/www/visitvault/backend/storage
sudo chown -R www-data:www-data /var/www/visitvault/backend/bootstrap/cache
sudo chmod -R 775 /var/www/visitvault/backend/storage
sudo chmod -R 775 /var/www/visitvault/backend/bootstrap/cache
```

### 3. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

**Production .env Configuration:**

```env
APP_NAME=VisitorVault
APP_ENV=production
APP_KEY=base64:... # Generate with: php artisan key:generate
APP_DEBUG=false
APP_TIMEZONE=UTC
APP_URL=https://your-domain.com

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=visitor_vault
DB_USERNAME=visitor_vault_user
DB_PASSWORD=secure_password_here

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database

# Queue (optional)
QUEUE_CONNECTION=database

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum
SANCTUM_STATEFUL_DOMAINS=your-domain.com,www.your-domain.com
SESSION_DOMAIN=.your-domain.com
```

### 4. Application Setup

```bash
# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
php artisan storage:link
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/visitvault`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    root /var/www/visitvault/backend/public;
    index index.php;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/visitvault-access.log;
    error_log /var/log/nginx/visitvault-error.log;

    # Max upload size
    client_max_body_size 20M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/visitvault /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6. Queue Worker Setup (Optional)

Create supervisor configuration `/etc/supervisor/conf.d/visitvault-worker.conf`:

```ini
[program:visitvault-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/visitvault/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/visitvault/backend/storage/logs/worker.log
stopwaitsecs=3600
```

Start worker:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start visitvault-worker:*
```

---

## Frontend Deployment

### Option 1: Serve from Backend (Simple)

Build and copy to Laravel public directory:

```bash
cd /var/www/visitvault/frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Copy to Laravel public
sudo cp -r dist/* /var/www/visitvault/backend/public/

# Set permissions
sudo chown -R www-data:www-data /var/www/visitvault/backend/public
```

### Option 2: Separate Static Hosting (Recommended)

#### Using Nginx

Create separate server block `/etc/nginx/sites-available/visitvault-frontend`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.your-domain.com;

    root /var/www/visitvault/frontend/dist;
    index index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/app.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.your-domain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Deploy Frontend

```bash
cd /var/www/visitvault/frontend

# Configure API URL
echo "VITE_API_URL=https://api.your-domain.com/api" > .env

# Build
npm run build

# Enable site
sudo ln -s /etc/nginx/sites-available/visitvault-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Database Setup

### Create Production Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE visitor_vault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'visitor_vault_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON visitor_vault.* TO 'visitor_vault_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
cd /var/www/visitvault/backend
php artisan migrate --force
```

### Database Optimization

```sql
-- Add indexes for performance (if not in migrations)
USE visitor_vault;

CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visitors_status ON visitors(status);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_check_in ON visits(check_in_time);
```

---

## SSL/HTTPS Configuration

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run

# Cron job for auto-renewal (already set up by certbot)
# Verify with:
sudo systemctl status certbot.timer
```

---

## Performance Optimization

### 1. Enable OPcache

Edit `/etc/php/8.2/fpm/php.ini`:

```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0
opcache.save_comments=1
opcache.fast_shutdown=1
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.2-fpm
```

### 2. Redis for Caching (Optional)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Laravel to use Redis
# In .env:
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### 3. Database Query Optimization

Enable query log to identify slow queries:

```php
// In AppServiceProvider boot() method
if (config('app.debug')) {
    DB::listen(function ($query) {
        if ($query->time > 100) { // Log queries over 100ms
            Log::warning('Slow query', [
                'sql' => $query->sql,
                'time' => $query->time
            ]);
        }
    });
}
```

### 4. Frontend Asset Optimization

Already handled by Vite build:
- Minification
- Tree shaking
- Code splitting
- Asset optimization

---

## Monitoring and Maintenance

### 1. Log Monitoring

```bash
# Laravel logs
tail -f /var/www/visitvault/backend/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/visitvault-error.log
tail -f /var/log/nginx/visitvault-access.log

# PHP-FPM logs
tail -f /var/log/php8.2-fpm.log
```

### 2. Error Tracking (Recommended)

Integrate with a service like Sentry:

```bash
composer require sentry/sentry-laravel
php artisan sentry:publish --dsn=your-sentry-dsn
```

### 3. Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake
- New Relic

### 4. Performance Monitoring

Use APM tools:
- New Relic
- DataDog
- Laravel Telescope (development)

---

## Backup Strategy

### 1. Database Backups

Create backup script `/usr/local/bin/backup-visitvault-db.sh`:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/visitvault"
DB_NAME="visitor_vault"
DB_USER="visitor_vault_user"
DB_PASS="your_db_password"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
```

Make executable and schedule:

```bash
sudo chmod +x /usr/local/bin/backup-visitvault-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-visitvault-db.sh >> /var/log/visitvault-backup.log 2>&1
```

### 2. File Backups

Backup uploaded files and application code:

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/visitvault"

# Backup storage directory
tar -czf $BACKUP_DIR/storage_backup_$TIMESTAMP.tar.gz /var/www/visitvault/backend/storage

# Keep only last 30 days
find $BACKUP_DIR -name "storage_backup_*.tar.gz" -mtime +30 -delete
```

### 3. Off-site Backups

Sync to AWS S3, Google Cloud Storage, or similar:

```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS credentials
aws configure

# Sync backups to S3
aws s3 sync /var/backups/visitvault s3://your-bucket/visitvault-backups/
```

---

## Troubleshooting

### Common Issues

#### 500 Internal Server Error

```bash
# Check Laravel logs
tail -f /var/www/visitvault/backend/storage/logs/laravel.log

# Check Nginx error log
tail -f /var/log/nginx/visitvault-error.log

# Check PHP-FPM log
tail -f /var/log/php8.2-fpm.log

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### Permission Issues

```bash
# Fix storage permissions
sudo chown -R www-data:www-data /var/www/visitvault/backend/storage
sudo chmod -R 775 /var/www/visitvault/backend/storage
```

#### Database Connection Failed

```bash
# Verify database credentials in .env
# Test connection
php artisan tinker
>>> DB::connection()->getPdo();
```

#### CORS Issues

Update `.env`:

```env
SANCTUM_STATEFUL_DOMAINS=your-frontend-domain.com
SESSION_DOMAIN=.your-domain.com
```

Clear cache:

```bash
php artisan config:clear
```

---

## Zero-Downtime Deployment

### Using Git Hooks

Create deployment script:

```bash
#!/bin/bash
cd /var/www/visitvault/backend

# Enable maintenance mode
php artisan down

# Pull latest changes
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Disable maintenance mode
php artisan up

# Restart PHP-FPM
sudo systemctl reload php8.2-fpm

echo "Deployment completed successfully"
```

---

## Security Checklist

- [ ] HTTPS enforced
- [ ] Strong database passwords
- [ ] Firewall configured (UFW)
- [ ] SSH key-based authentication
- [ ] Fail2ban installed
- [ ] Regular security updates
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload restrictions in place
- [ ] SQL injection protection (Eloquent ORM)
- [ ] XSS protection
- [ ] CSRF protection enabled

---

## Scaling Considerations

### Horizontal Scaling

- Load balancer (Nginx, HAProxy)
- Multiple application servers
- Shared file storage (NFS, S3)
- Database replication (master-slave)
- Redis cluster for sessions

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching (Redis, Memcached)
- CDN for static assets

---

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review error logs
- Check disk space
- Verify backups

**Monthly:**
- Update dependencies
- Security patches
- Performance review

**Quarterly:**
- Security audit
- Backup restore test
- Scaling assessment

---

© BethLog Information Systems Limited
