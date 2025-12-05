# VisitorVault - Troubleshooting Guide

Comprehensive troubleshooting guide for common issues in VisitorVault development and deployment.

---

## Table of Contents

1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Database Issues](#database-issues)
4. [API Issues](#api-issues)
5. [Authentication Issues](#authentication-issues)
6. [Deployment Issues](#deployment-issues)
7. [Performance Issues](#performance-issues)
8. [Common Error Messages](#common-error-messages)

---

## Backend Issues

### Issue: 500 Internal Server Error

**Symptoms:**
- Browser shows "500 Internal Server Error"
- API endpoints return 500 status

**Solutions:**

1. **Check Laravel logs:**
   ```bash
   tail -f backend/storage/logs/laravel.log
   ```

2. **Clear all caches:**
   ```bash
   cd backend
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

3. **Check file permissions:**
   ```bash
   # Ensure storage is writable
   chmod -R 775 storage
   chmod -R 775 bootstrap/cache
   
   # Ensure correct ownership
   chown -R www-data:www-data storage
   chown -R www-data:www-data bootstrap/cache
   ```

4. **Enable debug mode (development only):**
   ```env
   # In .env
   APP_DEBUG=true
   ```

---

### Issue: Class Not Found Error

**Symptoms:**
- Error message: "Class 'App\...' not found"

**Solutions:**

1. **Regenerate autoload files:**
   ```bash
   composer dump-autoload
   ```

2. **Clear config cache:**
   ```bash
   php artisan config:clear
   ```

3. **Ensure class exists and namespace is correct**

---

### Issue: Port Already in Use

**Symptoms:**
- Error: "Address already in use"
- Cannot start `php artisan serve`

**Solutions:**

1. **Find and kill process using port 8000:**
   ```bash
   # macOS/Linux
   lsof -ti:8000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   ```

2. **Use a different port:**
   ```bash
   php artisan serve --port=8001
   ```

---

### Issue: Migration Fails

**Symptoms:**
- Error during `php artisan migrate`

**Solutions:**

1. **Check database connection:**
   ```bash
   php artisan tinker
   >>> DB::connection()->getPdo();
   ```

2. **Ensure database exists (MySQL):**
   ```sql
   CREATE DATABASE visitor_vault;
   ```

3. **For SQLite, ensure file exists:**
   ```bash
   touch database/database.sqlite
   ```

4. **Rollback and retry:**
   ```bash
   php artisan migrate:rollback
   php artisan migrate
   ```

5. **Fresh start (WARNING: deletes all data):**
   ```bash
   php artisan migrate:fresh --seed
   ```

---

## Frontend Issues

### Issue: npm install Fails

**Symptoms:**
- Errors during `npm install`
- Dependency conflicts

**Solutions:**

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

2. **Delete and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Update npm:**
   ```bash
   npm install -g npm@latest
   ```

4. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

---

### Issue: Vite Build Fails

**Symptoms:**
- Build errors during `npm run build`
- TypeScript errors

**Solutions:**

1. **Check TypeScript errors:**
   ```bash
   npm run check
   ```

2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite dist
   npm run build
   ```

3. **Check for syntax errors in tsx/ts files**

4. **Ensure all imports are correct**

---

### Issue: Hot Reload Not Working

**Symptoms:**
- Changes not reflecting in browser
- Need to refresh manually

**Solutions:**

1. **Restart dev server:**
   ```bash
   # Ctrl+C to stop
   npm run dev
   ```

2. **Clear browser cache (hard refresh):**
   - Chrome: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   - Firefox: Ctrl+F5

3. **Check Vite config for HMR settings**

---

### Issue: Module Not Found

**Symptoms:**
- Error: "Cannot find module '@/components/...'"

**Solutions:**

1. **Check import path:**
   ```tsx
   // Correct
   import { Button } from '@/components/ui/button'
   
   // Incorrect
   import { Button } from 'components/ui/button'
   ```

2. **Ensure file exists at specified path**

3. **Check tsconfig.json path mapping:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

---

## Database Issues

### Issue: Database Connection Failed

**Symptoms:**
- Error: "SQLSTATE[HY000] [2002] Connection refused"

**Solutions:**

1. **Check database is running:**
   ```bash
   # MySQL
   sudo systemctl status mysql
   sudo systemctl start mysql
   
   # PostgreSQL
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Verify .env credentials:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=visitor_vault
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

3. **Test connection:**
   ```bash
   # MySQL
   mysql -u username -p -h 127.0.0.1
   
   # PostgreSQL
   psql -U username -h 127.0.0.1
   ```

---

### Issue: Foreign Key Constraint Error

**Symptoms:**
- Error: "Cannot add or update a child row: a foreign key constraint fails"

**Solutions:**

1. **Ensure parent record exists:**
   ```php
   // Before creating visit
   $visitor = Visitor::find($visitorId);
   if (!$visitor) {
       return error('Visitor not found');
   }
   ```

2. **Check migration order** (parent tables must be created first)

3. **Disable foreign key checks temporarily (development only):**
   ```sql
   SET FOREIGN_KEY_CHECKS=0;
   -- Your operation
   SET FOREIGN_KEY_CHECKS=1;
   ```

---

### Issue: Database Table Doesn't Exist

**Symptoms:**
- Error: "Base table or view not found: 1146 Table 'visitor_vault.visitors' doesn't exist"

**Solutions:**

1. **Run migrations:**
   ```bash
   php artisan migrate
   ```

2. **Check migration status:**
   ```bash
   php artisan migrate:status
   ```

3. **Fresh migration (WARNING: deletes data):**
   ```bash
   php artisan migrate:fresh
   ```

---

## API Issues

### Issue: API Returns 404 Not Found

**Symptoms:**
- All API calls return 404
- Endpoints not found

**Solutions:**

1. **Check API base URL:**
   ```env
   # Frontend .env
   VITE_API_URL=http://visitvault.test/api
   ```

2. **Verify route exists:**
   ```bash
   php artisan route:list | grep api
   ```

3. **Clear route cache:**
   ```bash
   php artisan route:clear
   ```

4. **Check .htaccess or nginx config** (production)

---

### Issue: CORS Error

**Symptoms:**
- Browser console: "Access to fetch...has been blocked by CORS policy"
- API works in Postman but not browser

**Solutions:**

1. **Check SANCTUM_STATEFUL_DOMAINS in .env:**
   ```env
   SANCTUM_STATEFUL_DOMAINS=localhost:5173,visitvault.test
   SESSION_DOMAIN=.visitvault.test
   ```

2. **Clear config cache:**
   ```bash
   php artisan config:clear
   ```

3. **Verify CORS middleware is applied**

4. **Check frontend URL matches allowed domains**

---

### Issue: API Returns Empty Response

**Symptoms:**
- 200 OK status but no data
- Response body is empty or null

**Solutions:**

1. **Check controller returns data:**
   ```php
   public function index() {
       $data = Visitor::all();
       return response()->json($data); // Don't forget to return!
   }
   ```

2. **Check for exceptions in logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Verify database has data:**
   ```bash
   php artisan tinker
   >>> Visitor::count();
   ```

---

## Authentication Issues

### Issue: Token Not Working

**Symptoms:**
- 401 Unauthorized despite having token
- "Unauthenticated" response

**Solutions:**

1. **Check token in request header:**
   ```javascript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

2. **Verify token exists and is valid:**
   ```bash
   # In database
   SELECT * FROM personal_access_tokens WHERE tokenable_id = 1;
   ```

3. **Check token hasn't expired**

4. **Ensure auth:sanctum middleware is applied:**
   ```php
   Route::middleware('auth:sanctum')->group(function () {
       // Protected routes
   });
   ```

---

### Issue: Cannot Login

**Symptoms:**
- Login returns 401 or validation error
- Credentials rejected

**Solutions:**

1. **Verify user exists:**
   ```bash
   php artisan tinker
   >>> User::where('email', 'user@example.com')->first();
   ```

2. **Check password:**
   ```bash
   # If user exists but can't login, reset password
   $user = User::where('email', 'user@example.com')->first();
   $user->password = Hash::make('newpassword');
   $user->save();
   ```

3. **Seed test users:**
   ```bash
   php artisan db:seed --class=UserSeeder
   ```

---

### Issue: Token Expires Too Quickly

**Symptoms:**
- Need to login frequently
- Sessions don't persist

**Solutions:**

1. **Configure token expiration in Sanctum config**

2. **Use "remember me" functionality**

3. **Implement refresh token mechanism**

---

## Deployment Issues

### Issue: 502 Bad Gateway (Nginx)

**Symptoms:**
- Nginx shows 502 error
- Application not accessible

**Solutions:**

1. **Check PHP-FPM is running:**
   ```bash
   sudo systemctl status php8.2-fpm
   sudo systemctl start php8.2-fpm
   ```

2. **Check nginx error log:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Verify PHP-FPM socket exists:**
   ```bash
   ls -la /var/run/php/php8.2-fpm.sock
   ```

---

### Issue: Environment Variables Not Loading

**Symptoms:**
- APP_KEY not set
- Database connection uses defaults

**Solutions:**

1. **Ensure .env file exists:**
   ```bash
   ls -la .env
   ```

2. **Clear config cache:**
   ```bash
   php artisan config:clear
   ```

3. **Don't cache in development:**
   ```bash
   # Remove cached config
   rm bootstrap/cache/config.php
   ```

---

### Issue: Storage Permissions Error

**Symptoms:**
- Cannot write logs
- Cannot upload files

**Solutions:**

1. **Fix permissions:**
   ```bash
   sudo chown -R www-data:www-data storage
   sudo chmod -R 775 storage
   ```

2. **Check SELinux (if applicable):**
   ```bash
   sudo setsebool -P httpd_unified 1
   ```

---

## Performance Issues

### Issue: Slow API Responses

**Solutions:**

1. **Use eager loading:**
   ```php
   // Bad (N+1 problem)
   $visits = Visit::all();
   foreach ($visits as $visit) {
       echo $visit->visitor->name; // Executes query for each visit
   }
   
   // Good
   $visits = Visit::with('visitor')->get();
   ```

2. **Add database indexes:**
   ```php
   $table->index('email');
   $table->index('status');
   ```

3. **Use pagination:**
   ```php
   Visitor::paginate(15);
   ```

4. **Enable caching:**
   ```php
   Cache::remember('visitors', 60, function () {
       return Visitor::all();
   });
   ```

---

### Issue: Frontend Slow to Load

**Solutions:**

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Enable gzip in nginx:**
   ```nginx
   gzip on;
   gzip_types text/css application/javascript;
   ```

3. **Use code splitting in React**

4. **Optimize images and assets**

---

## Common Error Messages

### "Class 'App\Providers\RouteServiceProvider' not found"

**Solution:**
```bash
composer dump-autoload
php artisan config:clear
```

---

### "Specified key was too long"

**Solution:**
Add to `app/Providers/AppServiceProvider.php`:
```php
use Illuminate\Support\Facades\Schema;

public function boot() {
    Schema::defaultStringLength(191);
}
```

---

### "The stream or file 'storage/logs/laravel.log' could not be opened"

**Solution:**
```bash
chmod -R 775 storage
chown -R www-data:www-data storage
```

---

### "419 Page Expired" (CSRF Token Mismatch)

**Solution:**
For API routes, CSRF is not needed (using token auth).
For web routes, ensure CSRF token is included in forms.

---

### "Target class [DatabaseSeeder] does not exist"

**Solution:**
```bash
composer dump-autoload
```

---

## Getting Additional Help

If your issue isn't covered here:

1. **Check logs:**
   - Backend: `storage/logs/laravel.log`
   - Nginx: `/var/log/nginx/error.log`
   - Browser: DevTools Console

2. **Enable debug mode (development):**
   ```env
   APP_DEBUG=true
   ```

3. **Search Laravel documentation:**
   - https://laravel.com/docs

4. **Check React/Vite documentation:**
   - https://react.dev
   - https://vitejs.dev

5. **Review project documentation:**
   - [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
   - [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

© BethLog Information Systems Limited
