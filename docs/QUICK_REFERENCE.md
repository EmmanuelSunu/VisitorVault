# VisitorVault - Quick Reference

Quick reference guide for common tasks and commands in VisitorVault development.

---

## 🚀 Quick Start

### Start Development Servers

```bash
# Backend (Laravel)
cd backend
php artisan serve
# OR with Herd: automatic at http://visitvault.test

# Frontend (React)
cd frontend
npm run dev
# Runs at http://localhost:5173
```

### Environment Setup

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Frontend
cd frontend
npm install
echo "VITE_API_URL=http://visitvault.test/api" > .env
```

---

## 📋 Common Commands

### Backend (Laravel)

#### Database
```bash
php artisan migrate              # Run migrations
php artisan migrate:fresh --seed # Fresh database with seed data
php artisan migrate:rollback     # Rollback last migration
php artisan db:seed              # Run seeders only
```

#### Cache
```bash
php artisan cache:clear    # Clear application cache
php artisan config:clear   # Clear config cache
php artisan route:clear    # Clear route cache
php artisan view:clear     # Clear compiled views
```

#### Development
```bash
php artisan tinker         # Interactive REPL
php artisan route:list     # List all routes
php artisan make:model     # Create model
php artisan make:controller # Create controller
php artisan make:migration # Create migration
php artisan test           # Run tests
```

### Frontend (React)

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
npm run check       # TypeScript type checking
```

---

## 🔑 Default Credentials

### Test Users (after seeding)

```
Admin:
Email: admin@example.com
Password: password

Host:
Email: host@example.com
Password: password

Reception:
Email: reception@example.com
Password: password
```

---

## 📡 API Endpoints Quick Reference

### Base URL
```
Development: http://visitvault.test/api
Production: https://your-domain.com/api
```

### Authentication
```bash
# Login
POST /api/login
Body: { "email": "user@example.com", "password": "password" }

# Register
POST /api/register
Body: { "name": "...", "email": "...", "password": "...", "role": "host" }

# Logout
POST /api/logout
Headers: Authorization: Bearer {token}
```

### Visitors
```bash
# Register visitor (public)
POST /api/visitor/register

# List visitors
GET /api/visitors

# Get checked-in visitors
GET /api/visitors/checked-in

# Get visitor
GET /api/visitor/{id}

# Update visitor
PATCH /api/visitor/{id}
```

### Visits
```bash
# List visits
GET /api/visits

# Create visit
POST /api/visits

# Get checked-in visits
GET /api/visits/checked-in

# Check in visitor
POST /api/visits/check-in-visitor

# Check out visitor
POST /api/visits/check-out-visitor

# Statistics
GET /api/visits/statistics
```

---

## 🗄️ Database Quick Reference

### Main Tables

```sql
users       -- System users (admin, host, reception)
visitors    -- Visitor information
visits      -- Individual visit records
companies   -- Company data
personal_access_tokens -- API tokens
```

### Quick Queries

```bash
# In Tinker (php artisan tinker)

# Get all visitors
Visitor::all();

# Get approved visitors
Visitor::where('status', 'approved')->get();

# Get checked-in visits
Visit::whereNotNull('check_in_time')
     ->whereNull('check_out_time')
     ->with('visitor')
     ->get();

# Create test visitor
Visitor::factory()->create();
```

---

## 🧪 Testing

### Run Tests

```bash
# Backend
cd backend
php artisan test

# Run specific test
php artisan test tests/Feature/VisitorTest.php

# With coverage
php artisan test --coverage
```

### Create Tests

```bash
# Feature test
php artisan make:test VisitorTest

# Unit test
php artisan make:test VisitorTest --unit
```

---

## 🐛 Debugging

### View Logs

```bash
# Laravel logs
tail -f backend/storage/logs/laravel.log

# Clear logs
> backend/storage/logs/laravel.log
```

### Common Issues

**500 Error:**
```bash
php artisan config:clear
php artisan cache:clear
# Check storage/logs/laravel.log
```

**Database Connection Error:**
```bash
# Check .env file
# For SQLite: ensure database/database.sqlite exists
touch backend/database/database.sqlite
php artisan migrate
```

**CORS Error:**
```bash
# Check .env SANCTUM_STATEFUL_DOMAINS
# Ensure frontend URL is included
```

---

## 📦 Creating New Features

### Backend: New API Endpoint

```bash
# 1. Create controller
php artisan make:controller ExampleController --api

# 2. Add route in routes/api.php
Route::get('/examples', [ExampleController::class, 'index']);

# 3. Implement controller method
public function index() {
    return response()->json(['data' => 'value']);
}
```

### Backend: New Database Table

```bash
# 1. Create model with migration
php artisan make:model Example -m

# 2. Edit migration in database/migrations/
public function up() {
    Schema::create('examples', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->timestamps();
    });
}

# 3. Run migration
php artisan migrate

# 4. Add to model $fillable
protected $fillable = ['name'];
```

### Frontend: New Page

```bash
# 1. Create page component in src/pages/
# example-page.tsx

# 2. Add route in App.tsx
<Route path="/example" component={ExamplePage} />

# 3. Add navigation link if needed
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Essential
APP_KEY=base64:...
APP_URL=http://visitvault.test
DB_CONNECTION=sqlite

# For production
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=mysql
```

### Frontend (.env)

```env
VITE_API_URL=http://visitvault.test/api
```

---

## 🛠️ Git Workflow

### Feature Development

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push
git push origin feature/my-feature

# 4. Create PR on GitHub
```

### Commit Message Format

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: improve code structure
test: add tests
chore: update dependencies
```

---

## 📊 Performance

### Backend Optimization

```bash
# Cache config for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize autoloader
composer install --optimize-autoloader --no-dev
```

### Database Optimization

```bash
# Use eager loading
Visit::with('visitor', 'host')->get();

# Use pagination
Visitor::paginate(15);

# Add indexes (in migration)
$table->index('email');
$table->index('status');
```

---

## 🚢 Deployment

### Build for Production

```bash
# Frontend
cd frontend
npm run build
# Output: dist/

# Backend
cd backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
```

### Quick Deploy Checklist

- [ ] Update .env for production
- [ ] Set APP_DEBUG=false
- [ ] Configure database
- [ ] Run migrations
- [ ] Build frontend assets
- [ ] Set proper permissions
- [ ] Configure web server
- [ ] Set up SSL certificate
- [ ] Configure backups

---

## 📞 Quick Links

- **Full Documentation**: [README.md](README.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **API Docs**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Database Schema**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 💡 Pro Tips

### Development

1. **Use Tinker for testing**: `php artisan tinker` is great for testing queries
2. **Tail logs while developing**: `tail -f storage/logs/laravel.log`
3. **Use factories for test data**: `Visitor::factory()->count(50)->create()`
4. **Enable query logging** to find slow queries

### Frontend

1. **Use React DevTools** for debugging
2. **Check network tab** for API issues
3. **TypeScript errors show in terminal** and editor
4. **Use React Query DevTools** for state inspection

### Debugging

1. **Check logs first**: Laravel log and browser console
2. **Use dd() or dump()** in PHP for debugging
3. **Use console.log()** sparingly in React
4. **Test API with Bruno** before frontend integration

---

## 🆘 Emergency Procedures

### Database Issue

```bash
# Backup database first!
cp database/database.sqlite database/backup.sqlite

# Fresh start
php artisan migrate:fresh --seed
```

### Application Not Working

```bash
# Clear everything
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Restart server
php artisan serve
```

### Frontend Build Failed

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

© BethLog Information Systems Limited
