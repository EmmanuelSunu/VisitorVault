# VisitorVault - Database Schema Documentation

## Overview

VisitorVault uses a relational database to manage visitors, visits, users, and companies. The system supports SQLite for development and MySQL/PostgreSQL for production environments.

---

## Entity-Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Company   │────────▶│   Visitor    │────────▶│    Visit    │
│             │  1:N    │              │  1:N    │             │
└─────────────┘         └──────────────┘         └─────────────┘
                              │                        │
                              │                        │
                              │ N:1                    │ N:1
                              │                        │
                              ▼                        ▼
                        ┌──────────────┐         ┌─────────────┐
                        │     User     │◀────────│    Visit    │
                        │   (Host)     │         │   (Host)    │
                        └──────────────┘         └─────────────┘
```

### Relationships
- **Company** → **Visitor**: One-to-Many (A company can have many visitors)
- **Visitor** → **Visit**: One-to-Many (A visitor can have many visits)
- **User** → **Visitor**: One-to-Many (A host can have many visitors)
- **User** → **Visit**: One-to-Many (A host can have many visits)

---

## Tables

### 1. users

Stores system users (hosts, reception staff, administrators).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) | NO | - | User's full name |
| email | VARCHAR(255) | NO | - | User's email (unique) |
| email_verified_at | TIMESTAMP | YES | NULL | Email verification timestamp |
| password | VARCHAR(255) | NO | - | Hashed password |
| role | VARCHAR(50) | NO | 'host' | User role (admin, host, reception) |
| remember_token | VARCHAR(100) | YES | NULL | Remember me token |
| created_at | TIMESTAMP | YES | NULL | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `email`
- INDEX: `role`

**Relationships:**
- Has many `visitors` (as host)
- Has many `visits` (as host)

**Model:** `App\Models\User`

**Traits:**
- `HasFactory`
- `Notifiable`
- `HasApiTokens` (Sanctum)

**Fillable Fields:**
- name
- email
- password
- role

**Hidden Fields:**
- password
- remember_token

**Casts:**
- email_verified_at → datetime
- password → hashed

---

### 2. companies

Stores company information for visitor associations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) | NO | - | Company name |
| address | TEXT | YES | NULL | Company address |
| contact_person | VARCHAR(255) | YES | NULL | Contact person name |
| contact_email | VARCHAR(255) | YES | NULL | Contact email |
| contact_phone | VARCHAR(50) | YES | NULL | Contact phone number |
| notes | TEXT | YES | NULL | Additional notes |
| created_at | TIMESTAMP | YES | NULL | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |
| deleted_at | TIMESTAMP | YES | NULL | Soft delete timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `name`
- INDEX: `deleted_at`

**Relationships:**
- Has many `visitors`

**Model:** `App\Models\Company`

**Traits:**
- `HasFactory`
- `SoftDeletes`

**Fillable Fields:**
- name
- address
- contact_person
- contact_email
- contact_phone
- notes

**Casts:**
- created_at → datetime
- updated_at → datetime
- deleted_at → datetime

---

### 3. visitors

Stores visitor information and approval status.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary key |
| f_name | VARCHAR(255) | NO | - | First name |
| l_name | VARCHAR(255) | NO | - | Last name |
| email | VARCHAR(255) | NO | - | Email address |
| phone | VARCHAR(50) | NO | - | Phone number |
| company | VARCHAR(255) | YES | NULL | Company name (legacy) |
| purpose | TEXT | YES | NULL | Purpose of visit |
| h_name | VARCHAR(255) | YES | NULL | Host name (legacy) |
| h_email | VARCHAR(255) | YES | NULL | Host email (legacy) |
| h_phone | VARCHAR(50) | YES | NULL | Host phone (legacy) |
| id_type | VARCHAR(100) | YES | NULL | ID document type |
| id_number | VARCHAR(100) | YES | NULL | ID document number |
| pic | TEXT | YES | NULL | Visitor photo (base64/path) |
| id_pic | TEXT | YES | NULL | ID photo (base64/path) |
| status | VARCHAR(50) | NO | 'pending' | Approval status (pending, approved, rejected) |
| visit_date | DATETIME | YES | NULL | Scheduled visit date |
| notes | TEXT | YES | NULL | Additional notes |
| user_id | BIGINT UNSIGNED | YES | NULL | Host user ID (FK) |
| created_at | TIMESTAMP | YES | NULL | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `email`
- INDEX: `phone`
- INDEX: `status`
- INDEX: `user_id`
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE SET NULL

**Relationships:**
- Belongs to `User` (host) via `user_id`
- Has many `visits`

**Model:** `App\Models\Visitor`

**Traits:**
- `HasFactory`
- `Notifiable`

**Fillable Fields:**
- f_name
- l_name
- purpose
- phone
- email
- company
- h_name
- h_email
- h_phone
- id_type
- id_number
- pic
- id_pic
- status
- visit_date
- notes
- user_id

**Casts:**
- visit_date → datetime

---

### 4. visits

Stores individual visit records with check-in/check-out tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary key |
| visitor_id | BIGINT UNSIGNED | NO | - | Visitor ID (FK) |
| user_id | BIGINT UNSIGNED | NO | - | Host user ID (FK) |
| visit_date | DATE | NO | - | Visit date |
| check_in_time | TIMESTAMP | YES | NULL | Check-in timestamp |
| check_out_time | TIMESTAMP | YES | NULL | Check-out timestamp |
| notes | TEXT | YES | NULL | Visit notes |
| badge_number | VARCHAR(50) | YES | NULL | Assigned badge number |
| created_at | TIMESTAMP | YES | NULL | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- INDEX: `visitor_id`
- INDEX: `user_id`
- INDEX: `visit_date`
- INDEX: `check_in_time`
- INDEX: `check_out_time`
- INDEX: `badge_number`
- FOREIGN KEY: `visitor_id` REFERENCES `visitors(id)` ON DELETE CASCADE
- FOREIGN KEY: `user_id` REFERENCES `users(id)` ON DELETE CASCADE

**Relationships:**
- Belongs to `Visitor` via `visitor_id`
- Belongs to `User` (host) via `user_id`

**Model:** `App\Models\Visit`

**Traits:**
- `HasFactory`

**Fillable Fields:**
- visitor_id
- user_id
- visit_date
- check_in_time
- check_out_time
- notes
- badge_number

**Casts:**
- visit_date → date
- check_in_time → datetime
- check_out_time → datetime

---

### 5. personal_access_tokens (Sanctum)

Stores API authentication tokens.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BIGINT UNSIGNED | NO | AUTO_INCREMENT | Primary key |
| tokenable_type | VARCHAR(255) | NO | - | Model type (polymorphic) |
| tokenable_id | BIGINT UNSIGNED | NO | - | Model ID (polymorphic) |
| name | VARCHAR(255) | NO | - | Token name |
| token | VARCHAR(64) | NO | - | Token hash (unique) |
| abilities | TEXT | YES | NULL | Token abilities (JSON) |
| last_used_at | TIMESTAMP | YES | NULL | Last usage timestamp |
| expires_at | TIMESTAMP | YES | NULL | Expiration timestamp |
| created_at | TIMESTAMP | YES | NULL | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Indexes:**
- PRIMARY KEY: `id`
- UNIQUE: `token`
- INDEX: `tokenable_type`, `tokenable_id`

---

## Migrations

### Migration Files

Located in `backend/database/migrations/`

#### Core Migrations
1. **0001_01_01_000000_create_users_table.php**
   - Creates `users` table
   - Creates `password_reset_tokens` table
   - Creates `sessions` table

2. **0001_01_01_000001_create_cache_table.php**
   - Creates `cache` table
   - Creates `cache_locks` table

3. **0001_01_01_000002_create_jobs_table.php**
   - Creates `jobs` table
   - Creates `job_batches` table
   - Creates `failed_jobs` table

#### Custom Migrations
4. **2025_01_12_082353_create_visitors_table.php**
   - Creates `visitors` table

5. **2025_01_13_030823_create_companies_table.php**
   - Creates `companies` table

6. **2025_07_19_152815_create_visits_table.php**
   - Creates `visits` table
   - Implements new visit tracking system

7. **2025_07_19_152903_remove_check_in_out_from_visitors_table.php**
   - Removes `check_in_time` and `check_out_time` from `visitors` table
   - Part of visits migration (see VISITS_MIGRATION_SUMMARY.md)

### Running Migrations

```bash
# Run all pending migrations
php artisan migrate

# Rollback last migration batch
php artisan migrate:rollback

# Reset all migrations
php artisan migrate:reset

# Fresh migration (drop all tables and re-migrate)
php artisan migrate:fresh

# Fresh with seeding
php artisan migrate:fresh --seed
```

---

## Data Seeding

### Seeders

Located in `backend/database/seeders/`

#### 1. DatabaseSeeder
Main seeder that orchestrates all other seeders.

**Execution Order:**
1. UserSeeder
2. CompanySeeder (if exists)
3. VisitorSeeder
4. VisitSeeder

#### 2. UserSeeder
Creates default users for testing.

**Default Users:**
- Admin: admin@example.com
- Host: host@example.com
- Reception: reception@example.com

#### 3. VisitorSeeder
Creates sample visitor records.

**Uses:** `VisitorFactory`

#### 4. VisitSeeder
Creates sample visit records.

**Uses:** `VisitFactory`

### Running Seeders

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=UserSeeder

# Fresh migration with seeding
php artisan migrate:fresh --seed
```

---

## Factories

### Factory Classes

Located in `backend/database/factories/`

#### 1. UserFactory
Generates fake user data.

**Generates:**
- Random names
- Unique emails
- Hashed passwords
- Random roles (admin, host, reception)

#### 2. VisitorFactory
Generates fake visitor data.

**Generates:**
- Random first/last names
- Unique emails
- Phone numbers
- Company associations
- Status (pending, approved, rejected)
- Visit dates

#### 3. VisitFactory
Generates fake visit data.

**Generates:**
- Visit dates
- Check-in/check-out times
- Random notes
- Badge numbers
- Associations to visitors and users

### Using Factories

```php
// Create a single visitor
Visitor::factory()->create();

// Create multiple visitors
Visitor::factory()->count(50)->create();

// Create with specific attributes
Visitor::factory()->create([
    'status' => 'approved',
    'email' => 'test@example.com'
]);

// Create with relationships
Visit::factory()
    ->for(Visitor::factory())
    ->for(User::factory())
    ->create();
```

---

## Query Examples

### Common Queries

#### Get all approved visitors
```php
$visitors = Visitor::where('status', 'approved')->get();
```

#### Get currently checked-in visits
```php
$activeVisits = Visit::whereNotNull('check_in_time')
    ->whereNull('check_out_time')
    ->with(['visitor', 'host'])
    ->get();
```

#### Get visitor with all visits
```php
$visitor = Visitor::with('visits')->find($id);
```

#### Get visits for a specific date
```php
$todayVisits = Visit::whereDate('visit_date', today())
    ->with(['visitor', 'host'])
    ->get();
```

#### Get host's visitors
```php
$hostVisitors = User::find($hostId)
    ->visitors()
    ->where('status', 'approved')
    ->get();
```

#### Get company visitors
```php
$companyVisitors = Company::find($companyId)
    ->visitors()
    ->with('visits')
    ->get();
```

---

## Data Validation

### Validation Rules (in Form Requests)

#### StoreVisitorRequest
```php
'f_name' => 'required|string|max:255',
'l_name' => 'required|string|max:255',
'email' => 'required|email|unique:visitors,email',
'phone' => 'required|string|max:50',
'purpose' => 'nullable|string',
'photo' => 'nullable|string',
'user_id' => 'required|exists:users,id'
```

#### UpdateVisitorRequest
```php
'status' => 'in:pending,approved,rejected',
'notes' => 'nullable|string'
```

#### StoreCompanyRequest
```php
'name' => 'required|string|max:255|unique:companies,name',
'address' => 'nullable|string',
'contact_email' => 'nullable|email'
```

---

## Database Optimization

### Recommended Indexes

Already implemented:
- Primary keys on all tables
- Foreign key indexes
- Email and phone indexes on visitors
- Status index on visitors
- Date indexes on visits
- Check-in/check-out indexes on visits

### Performance Tips

1. **Use Eager Loading** to avoid N+1 queries:
   ```php
   Visit::with(['visitor', 'host'])->get();
   ```

2. **Use Pagination** for large datasets:
   ```php
   Visitor::paginate(15);
   ```

3. **Use Query Scopes** for reusable queries:
   ```php
   // In Visit model
   public function scopeCheckedIn($query) {
       return $query->whereNotNull('check_in_time')
                   ->whereNull('check_out_time');
   }
   
   // Usage
   Visit::checkedIn()->get();
   ```

4. **Cache Frequently Accessed Data**:
   ```php
   Cache::remember('active_visits', 60, function() {
       return Visit::checkedIn()->count();
   });
   ```

---

## Backup and Restore

### Backup Database

#### SQLite
```bash
# Copy database file
cp database/database.sqlite database/backups/backup_$(date +%Y%m%d).sqlite
```

#### MySQL
```bash
# Create backup
mysqldump -u username -p visitor_vault > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u username -p visitor_vault < backup_20250101.sql
```

#### PostgreSQL
```bash
# Create backup
pg_dump -U username visitor_vault > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U username visitor_vault < backup_20250101.sql
```

---

## Database Maintenance

### Cleanup Tasks

#### Remove old soft-deleted records
```php
// Remove companies deleted more than 30 days ago
Company::onlyTrashed()
    ->where('deleted_at', '<', now()->subDays(30))
    ->forceDelete();
```

#### Archive old visits
```php
// Move visits older than 1 year to archive table
Visit::where('visit_date', '<', now()->subYear())
    ->chunk(1000, function($visits) {
        // Archive logic here
    });
```

---

## Security Considerations

1. **SQL Injection Prevention**: Laravel's Eloquent ORM and Query Builder automatically protect against SQL injection

2. **Mass Assignment Protection**: Use `$fillable` or `$guarded` properties in models

3. **Soft Deletes**: Use `SoftDeletes` trait for data that should be recoverable

4. **Password Hashing**: Passwords automatically hashed using `'hashed'` cast

5. **API Token Security**: Sanctum tokens are hashed in database

---

## Schema Version

- **Current Version**: 2.0 (with visits table)
- **Last Updated**: July 2025
- **Migration Status**: All migrations completed

For migration details, see [VISITS_MIGRATION_SUMMARY.md](file:///c:/Users/sever/OneDrive/Documents/code/work/VisitorVault/VISITS_MIGRATION_SUMMARY.md)

---

© BethLog Information Systems Limited
