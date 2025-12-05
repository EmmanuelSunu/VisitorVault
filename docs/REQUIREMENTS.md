# VisitorVault - Technical Requirements

## System Requirements

### Development Environment

#### Backend Requirements
- **PHP**: 8.2 or higher
- **Composer**: 2.x
- **Database**: 
  - SQLite 3 (development)
  - MySQL 8.0+ or PostgreSQL 13+ (production)
- **Web Server**: 
  - Laravel Herd (development)
  - Nginx 1.18+ or Apache 2.4+ (production)
- **PHP Extensions**:
  - PDO
  - PDO_SQLite (development)
  - PDO_MySQL or PDO_PGSQL (production)
  - OpenSSL
  - Mbstring
  - Tokenizer
  - XML
  - Ctype
  - JSON
  - BCMath
  - Fileinfo

#### Frontend Requirements
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Production Environment
- **Server**: Linux (Ubuntu 22.04 LTS recommended)
- **Memory**: Minimum 512MB RAM, 2GB+ recommended
- **Storage**: 10GB+ available disk space
- **SSL Certificate**: Required for HTTPS

---

## Backend Dependencies

### Core Dependencies (composer.json)

#### Production Dependencies
```json
{
  "php": "^8.2",
  "laravel/framework": "^12.0",
  "laravel/sanctum": "^4.0",
  "laravel/tinker": "^2.10.1"
}
```

**Package Descriptions:**

- **laravel/framework** (^12.0)
  - The Laravel framework core
  - Provides MVC architecture, routing, ORM, authentication, and more
  - Full-featured PHP framework for web applications

- **laravel/sanctum** (^4.0)
  - Token-based API authentication
  - SPA authentication
  - Mobile application token authentication
  - Simple and lightweight

- **laravel/tinker** (^2.10.1)
  - REPL (interactive shell) for Laravel
  - Database querying and debugging
  - Model interaction in console

#### Development Dependencies
```json
{
  "fakerphp/faker": "^1.23",
  "laravel/pail": "^1.2.2",
  "laravel/pint": "^1.13",
  "laravel/sail": "^1.41",
  "mockery/mockery": "^1.6",
  "nunomaduro/collision": "^8.6",
  "phpunit/phpunit": "^11.5.3"
}
```

**Package Descriptions:**

- **fakerphp/faker** (^1.23)
  - Generate fake data for testing and seeding
  - Create realistic test data (names, emails, addresses, etc.)

- **laravel/pail** (^1.2.2)
  - Real-time log tailing for Laravel applications
  - Enhanced log viewing in development

- **laravel/pint** (^1.13)
  - Code style fixer for PHP
  - Ensures consistent code formatting
  - Based on PHP-CS-Fixer

- **laravel/sail** (^1.41)
  - Docker development environment for Laravel
  - Simplified Docker setup
  - Development containers for PHP, MySQL, Redis, etc.

- **mockery/mockery** (^1.6)
  - Mocking framework for PHP unit tests
  - Create test doubles
  - Verify method calls and expectations

- **nunomaduro/collision** (^8.6)
  - Beautiful error reporting for CLI
  - Enhanced exception handling
  - Better test output formatting

- **phpunit/phpunit** (^11.5.3)
  - PHP testing framework
  - Unit and feature testing
  - Test automation

---

## Frontend Dependencies

### Core Dependencies (package.json)

#### UI Framework & Core
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "vite": "^5.4.19",
  "typescript": "5.6.3"
}
```

**Package Descriptions:**

- **react** (^18.3.1) - Core React library for building UI components
- **react-dom** (^18.3.1) - React renderer for web applications
- **vite** (^5.4.19) - Fast build tool and development server
- **typescript** (5.6.3) - TypeScript language support

#### Styling & Design System
```json
{
  "tailwindcss": "^3.4.17",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.47",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "tailwindcss-animate": "^1.0.7",
  "tw-animate-css": "^1.2.5",
  "@tailwindcss/typography": "^0.5.15",
  "@tailwindcss/vite": "^4.1.3"
}
```

**Key Styling Packages:**
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Type-safe component variants
- **tailwind-merge** - Merge Tailwind classes efficiently
- **tailwindcss-animate** - Animation utilities

#### Radix UI Components (40+ primitives)
```json
{
  "@radix-ui/react-accordion": "^1.2.4",
  "@radix-ui/react-alert-dialog": "^1.1.7",
  "@radix-ui/react-avatar": "^1.1.4",
  "@radix-ui/react-checkbox": "^1.1.5",
  "@radix-ui/react-dialog": "^1.1.7",
  "@radix-ui/react-dropdown-menu": "^2.1.7",
  "@radix-ui/react-label": "^2.1.3",
  "@radix-ui/react-popover": "^1.1.7",
  "@radix-ui/react-select": "^2.1.7",
  "@radix-ui/react-tabs": "^1.1.4",
  "@radix-ui/react-toast": "^1.2.7"
}
```

**Purpose:** Unstyled, accessible UI primitives for building custom components

#### Forms & Validation
```json
{
  "react-hook-form": "^7.55.0",
  "@hookform/resolvers": "^3.10.0",
  "zod": "^3.24.2",
  "zod-validation-error": "^3.4.0"
}
```

**Package Descriptions:**
- **react-hook-form** - Performant form handling
- **zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Zod integration with React Hook Form

#### State Management & Data Fetching
```json
{
  "@tanstack/react-query": "^5.81.5",
  "axios": "^1.10.0"
}
```

**Package Descriptions:**
- **@tanstack/react-query** - Powerful async state management and data fetching
- **axios** - Promise-based HTTP client

#### Routing
```json
{
  "wouter": "^3.3.5"
}
```

**Package Description:**
- **wouter** - Minimalist routing for React (< 1.5KB)

#### Date & Time
```json
{
  "date-fns": "^3.6.0",
  "react-day-picker": "^8.10.1"
}
```

**Package Descriptions:**
- **date-fns** - Modern JavaScript date utility library
- **react-day-picker** - Date picker component

#### Charts & Data Visualization
```json
{
  "recharts": "^2.15.2"
}
```

**Package Description:**
- **recharts** - Composable charting library built with React components

#### Animations
```json
{
  "framer-motion": "^11.13.1",
  "embla-carousel-react": "^8.6.0"
}
```

**Package Descriptions:**
- **framer-motion** - Production-ready motion library for React
- **embla-carousel-react** - Lightweight carousel library

#### Icons & Assets
```json
{
  "lucide-react": "^0.453.0",
  "react-icons": "^5.4.0"
}
```

**Package Descriptions:**
- **lucide-react** - Beautiful & consistent icon pack
- **react-icons** - Popular icon library aggregator

#### Utilities
```json
{
  "qrcode": "^1.5.4",
  "input-otp": "^1.4.2",
  "nanoid": "^5.1.5",
  "next-themes": "^0.4.6",
  "cmdk": "^1.1.1",
  "vaul": "^1.1.2"
}
```

**Package Descriptions:**
- **qrcode** - QR code generation
- **input-otp** - OTP input component
- **nanoid** - Unique ID generator
- **next-themes** - Theme management (dark/light mode)
- **cmdk** - Command menu component
- **vaul** - Drawer/bottom sheet component

---

## Database Requirements

### SQLite (Development)
- **Version**: 3.x
- **File**: `database/database.sqlite`
- **Configuration**: Pre-configured in `.env`
- **Advantages**: 
  - Zero configuration
  - File-based
  - Perfect for development

### MySQL (Production - Recommended)
- **Version**: 8.0 or higher
- **Configuration**:
  ```env
  DB_CONNECTION=mysql
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_DATABASE=visitor_vault
  DB_USERNAME=your_username
  DB_PASSWORD=your_password
  ```

### PostgreSQL (Production - Alternative)
- **Version**: 13 or higher
- **Configuration**:
  ```env
  DB_CONNECTION=pgsql
  DB_HOST=127.0.0.1
  DB_PORT=5432
  DB_DATABASE=visitor_vault
  DB_USERNAME=your_username
  DB_PASSWORD=your_password
  ```

---

## Environment Variables

### Backend (.env)

#### Required Variables
```env
APP_NAME=VisitorVault
APP_ENV=local|production
APP_KEY=base64:... # Generated by php artisan key:generate
APP_DEBUG=true|false
APP_TIMEZONE=UTC
APP_URL=http://visitvault.test

# Database
DB_CONNECTION=sqlite|mysql|pgsql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=visitor_vault
DB_USERNAME=root
DB_PASSWORD=

# CORS
SANCTUM_STATEFUL_DOMAINS=localhost:5173,visitvault.test
SESSION_DOMAIN=.visitvault.test
```

#### Optional Variables
```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@visitvault.test"
MAIL_FROM_NAME="${APP_NAME}"

# Queue
QUEUE_CONNECTION=sync|database|redis

# Cache
CACHE_STORE=file|database|redis

# Session
SESSION_DRIVER=file|cookie|database|redis
```

### Frontend (.env)

```env
# API Configuration
VITE_API_URL=http://visitvault.test/api

# Optional
VITE_APP_NAME=VisitorVault
```

---

## Installation Dependencies

### System-Level Installation

#### macOS
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PHP 8.2
brew install php@8.2

# Install Composer
brew install composer

# Install Node.js
brew install node@18

# Install Laravel Herd (optional, recommended for development)
# Download from: https://herd.laravel.com/
```

#### Ubuntu/Debian
```bash
# Update package manager
sudo apt update

# Install PHP 8.2 and extensions
sudo apt install php8.2 php8.2-cli php8.2-fpm php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-zip php8.2-sqlite3 php8.2-mysql

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Windows
```powershell
# Install using Chocolatey
choco install php --version=8.2
choco install composer
choco install nodejs-lts

# Or install Laravel Herd for Windows
# Download from: https://herd.laravel.com/
```

---

## Build Dependencies

### Backend Build

#### Autoloader
- Uses Composer's PSR-4 autoloading
- Automatically generated on `composer install`

#### Asset Pipeline
- Laravel Vite integration for frontend assets
- JavaScript/CSS bundling via Vite

### Frontend Build

#### Build Tool: Vite
```bash
# Development
npm run dev

# Production build
npm run build
# Output: dist/ directory

# Preview production build
npm run preview
```

#### TypeScript Compilation
- Uses `tsc` for type checking
- Vite handles transpilation during build

---

## Testing Dependencies

### Backend Testing
- **PHPUnit**: ^11.5.3
- **Faker**: ^1.23 (test data generation)
- **Mockery**: ^1.6 (mocking)

### API Testing
- **Bruno**: API client for testing endpoints
- Collections included in `visitapis/` directory

---

## Optional Dependencies

### Development Tools
- **Laravel Sail**: Docker environment (optional)
- **Laravel Pail**: Log monitoring
- **Laravel Pint**: Code formatting

### Performance
- **Redis** (optional): For caching and queues
- **Memcached** (optional): For caching

---

## Browser Requirements

### Minimum Browser Versions
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Opera**: 76+

### Required Features
- ES6+ JavaScript support
- WebRTC (for photo capture)
- LocalStorage
- Fetch API
- CSS Grid & Flexbox
- CSS Custom Properties

---

## Network Requirements

### Development
- **Backend Port**: 8000 (Laravel Serve) or 80/443 (Herd)
- **Frontend Port**: 5173 (Vite dev server)
- **Database Port**: 
  - MySQL: 3306
  - PostgreSQL: 5432

### Production
- **HTTP**: Port 80
- **HTTPS**: Port 443 (required)
- **WebSocket**: Port varies (if using broadcasting)

---

## Security Requirements

### SSL/TLS
- Production MUST use HTTPS
- Valid SSL certificate required

### CORS Configuration
- Configure allowed origins in backend
- Set `SANCTUM_STATEFUL_DOMAINS` appropriately

### API Token Security
- Sanctum tokens for authentication
- Secure token storage in frontend
- Token expiration policies

---

## Deployment Requirements

### Minimum Server Specifications
- **CPU**: 1 core (2+ recommended)
- **RAM**: 512MB (2GB+ recommended)
- **Storage**: 10GB available
- **Bandwidth**: 100GB/month (varies by usage)

### Recommended Production Setup
- **Web Server**: Nginx with PHP-FPM
- **Database**: MySQL 8.0 on separate server
- **Cache**: Redis for sessions and cache
- **Queue Worker**: Supervisor for job processing
- **SSL**: Let's Encrypt or commercial certificate

### Backup Requirements
- Daily database backups
- Weekly full application backups
- Off-site backup storage
- Backup retention: 30 days minimum

---

## Development Tools (Recommended)

### Code Editors
- Visual Studio Code with extensions:
  - PHP Intelephense
  - Laravel Blade Snippets
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

### Database Tools
- TablePlus
- phpMyAdmin
- DBeaver
- Sequel Ace (macOS)

### API Testing
- Bruno (included in project)
- Postman (alternative)
- Insomnia (alternative)

---

## Version Control

### Git Requirements
- **Git**: 2.x or higher
- Repository includes:
  - `.gitignore` for Laravel and Node.js
  - `.gitattributes` for line endings

### Excluded from Version Control
- `vendor/` (backend dependencies)
- `node_modules/` (frontend dependencies)
- `.env` (environment variables)
- `database/database.sqlite` (development database)
- `storage/` (uploaded files, logs, cache)
- `dist/` (frontend build output)

---

## CI/CD Requirements (Optional)

### Recommended Tools
- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins

### Pipeline Steps
1. Install dependencies
2. Run linters (Pint, ESLint)
3. Run tests (PHPUnit)
4. Build frontend assets
5. Deploy to staging/production

---

## Monitoring Requirements (Production)

### Application Monitoring
- Error tracking (e.g., Sentry, Bugsnag)
- Performance monitoring (e.g., New Relic, DataDog)
- Uptime monitoring (e.g., UptimeRobot, Pingdom)

### Server Monitoring
- CPU, Memory, Disk usage
- Database performance
- Network traffic
- Log aggregation

---

## Compliance & Standards

### Code Standards
- **PHP**: PSR-12 coding standard
- **TypeScript**: ESLint + Prettier
- **Git Commits**: Conventional Commits (recommended)

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility

### Security Standards
- OWASP Top 10 considerations
- Regular dependency updates
- Security headers (CORS, CSP, HSTS)

---

## License

All dependencies are MIT-licensed or compatible open-source licenses.
Main project: MIT License
