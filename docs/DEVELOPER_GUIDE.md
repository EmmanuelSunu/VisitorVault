# VisitorVault - Developer Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Backend Development](#backend-development)
6. [Frontend Development](#frontend-development)
7. [Testing](#testing)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **PHP 8.2+** with required extensions
- **Composer 2.x**
- **Node.js 18+** and npm
- **Git**
- **Laravel Herd** (recommended for development) OR **PHP development server**
- **Code Editor** (VS Code recommended)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd VisitorVault

# Backend setup
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve  # or use Laravel Herd

# Frontend setup (in new terminal)
cd ../frontend
npm install
npm run dev

# API Testing (optional)
# Open Bruno and load the visitapis/ collection
```

---

## Development Environment Setup

### 1. Backend Setup (Laravel)

#### Using Laravel Herd (Recommended)

Laravel Herd provides zero-config PHP and Laravel development.

```bash
# Download and install Herd from https://herd.laravel.com/

# After installation, Herd auto-detects Laravel projects
# Your backend will be available at:
# http://visitvault.test
```

#### Manual Setup

```bash
cd backend

# Install dependencies
composer install

# Environment setup
cp .env.example .env

# Generate application key
php artisan key:generate

# Create database (SQLite)
touch database/database.sqlite

# Run migrations
php artisan migrate

# Seed database with test data
php artisan db:seed

# Start development server
php artisan serve
# Backend available at: http://localhost:8000
```

#### Environment Configuration (.env)

```env
APP_NAME=VisitorVault
APP_ENV=local
APP_DEBUG=true
APP_URL=http://visitvault.test

DB_CONNECTION=sqlite
# For MySQL/PostgreSQL, configure accordingly

SANCTUM_STATEFUL_DOMAINS=localhost:5173,visitvault.test
SESSION_DOMAIN=.visitvault.test
```

### 2. Frontend Setup (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Environment setup
cp .env.example .env

# Configure API URL in .env
echo "VITE_API_URL=http://visitvault.test/api" > .env

# Start development server
npm run dev
# Frontend available at: http://localhost:5173
```

### 3. VS Code Setup

#### Recommended Extensions

Install the following VS Code extensions:

```json
{
  "recommendations": [
    "bmewburn.vscode-intelephense-client",
    "amiralizadeh9480.laravel-extra-intellisense",
    "shufo.vscode-blade-formatter",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "firsttris.vscode-jest-runner"
  ]
}
```

#### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[php]": {
    "editor.defaultFormatter": "bmewburn.vscode-intelephense-client"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## Project Structure

### Backend Structure (Laravel)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # API Controllers
│   │   ├── Middleware/       # Custom middleware
│   │   └── Requests/         # Form request validation
│   ├── Models/               # Eloquent models
│   ├── Notifications/        # Email notifications
│   └── Policies/             # Authorization policies
├── database/
│   ├── factories/            # Model factories
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
├── routes/
│   ├── api.php              # API routes
│   ├── web.php              # Web routes
│   └── console.php          # Console commands
├── config/                   # Configuration files
├── storage/                  # File storage
└── tests/                    # PHPUnit tests
```

### Frontend Structure (React)

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/              # Radix UI components
│   │   ├── header.tsx       # Navigation header
│   │   ├── photo-capture-modal.tsx
│   │   └── qr-display-modal.tsx
│   ├── pages/               # Page components
│   │   ├── landing.tsx
│   │   ├── visitor-registration.tsx
│   │   ├── host-dashboard.tsx
│   │   ├── reception-interface.tsx
│   │   └── admin-panel.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts       # Authentication hook
│   ├── lib/                 # Utility functions
│   │   └── utils.ts
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                   # Static assets
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## Coding Standards

### PHP (Backend)

Follow **PSR-12** coding standard.

```bash
# Run PHP linter (Laravel Pint)
./vendor/bin/pint

# Check code style without fixing
./vendor/bin/pint --test
```

#### Naming Conventions

- **Classes**: PascalCase (`VisitorController`)
- **Methods**: camelCase (`checkInVisitor()`)
- **Variables**: camelCase (`$visitorName`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_VISITORS`)
- **Database tables**: snake_case (`visitors`, `personal_access_tokens`)
- **Model properties**: snake_case (`first_name`, `check_in_time`)

#### Code Example

```php
<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    /**
     * Display a listing of visitors.
     */
    public function index(Request $request)
    {
        $visitors = Visitor::query()
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->with('host')
            ->paginate(15);

        return response()->json($visitors);
    }
}
```

### TypeScript/React (Frontend)

Follow **ESLint** and **Prettier** rules.

```bash
# Run TypeScript type checking
npm run check

# Format code
npm run format  # (if configured)
```

#### Naming Conventions

- **Components**: PascalCase (`VisitorCard.tsx`)
- **Files**: kebab-case (`visitor-registration.tsx`)
- **Functions**: camelCase (`handleSubmit()`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces/Types**: PascalCase (`interface VisitorData {}`)

#### Code Example

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface VisitorFormProps {
  onSubmit: (data: VisitorData) => void
}

export function VisitorForm({ onSubmit }: VisitorFormProps) {
  const [formData, setFormData] = useState<VisitorData>({
    firstName: '',
    lastName: '',
    email: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

---

## Backend Development

### Creating a New Controller

```bash
# Create controller
php artisan make:controller ExampleController --api

# Create controller with model
php artisan make:controller ExampleController --model=Example --api
```

### Creating a New Model

```bash
# Create model with migration and factory
php artisan make:model Example -mf

# Create complete resource (model, migration, factory, seeder, controller)
php artisan make:model Example -a
```

### Database Migrations

```bash
# Create migration
php artisan make:migration create_examples_table

# Run migrations
php artisan migrate

# Rollback last batch
php artisan migrate:rollback

# Fresh migration (drops all tables)
php artisan migrate:fresh --seed
```

### Form Request Validation

```bash
# Create form request
php artisan make:request StoreExampleRequest
```

Example:
```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:examples,email',
        ];
    }
}
```

### API Routes

Add routes in `routes/api.php`:

```php
use App\Http\Controllers\ExampleController;

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('examples', ExampleController::class);
});
```

### Eloquent Relationships

```php
// In Visitor model
public function visits(): HasMany
{
    return $this->hasMany(Visit::class);
}

// In Visit model
public function visitor(): BelongsTo
{
    return $this->belongsTo(Visitor::class);
}

// Usage
$visitor = Visitor::with('visits')->find($id);
```

### Authentication

```php
// In controller
public function index(Request $request)
{
    $user = $request->user();  // Get authenticated user
    
    // Check user role
    if ($user->role !== 'admin') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
}
```

---

## Frontend Development

### Creating a New Component

```bash
# Create in src/components/
touch src/components/example-component.tsx
```

Example component:
```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card'

interface ExampleProps {
  title: string
  children: React.ReactNode
}

export function ExampleComponent({ title, children }: ExampleProps) {
  return (
    <Card>
      <CardHeader>
        <h2>{title}</h2>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
```

### Using React Query for API Calls

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

// Fetch data
function useVisitors() {
  return useQuery({
    queryKey: ['visitors'],
    queryFn: async () => {
      const { data } = await axios.get('/api/visitors')
      return data
    }
  })
}

// Mutate data
function useCreateVisitor() {
  return useMutation({
    mutationFn: async (visitorData) => {
      const { data } = await axios.post('/api/visitor/register', visitorData)
      return data
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['visitors'] })
    }
  })
}
```

### Using Forms with React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  email: z.string().email('Invalid email')
})

type FormData = z.infer<typeof schema>

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('firstName')} />
      {errors.firstName && <span>{errors.firstName.message}</span>}
      
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Routing with Wouter

```tsx
import { Route, Switch } from 'wouter'

function App() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/register" component={VisitorRegistration} />
      <Route path="/dashboard" component={HostDashboard} />
      <Route>
        <NotFound />
      </Route>
    </Switch>
  )
}
```

### Using Tailwind CSS

```tsx
export function Button() {
  return (
    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
      Click Me
    </button>
  )
}
```

---

## Testing

### Backend Testing (PHPUnit)

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/VisitorTest.php

# Run with coverage
php artisan test --coverage
```

#### Creating Tests

```bash
# Create feature test
php artisan make:test VisitorTest

# Create unit test
php artisan make:test VisitorTest --unit
```

Example test:
```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Visitor;

class VisitorTest extends TestCase
{
    public function test_can_create_visitor(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->postJson('/api/visitor/register', [
            'f_name' => 'John',
            'l_name' => 'Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('visitors', [
            'email' => 'john@example.com'
        ]);
    }
}
```

### Frontend Testing

(Add testing framework if needed - Vitest, Jest, React Testing Library)

---

## Common Tasks

### Add a New API Endpoint

1. **Create route** in `routes/api.php`:
```php
Route::get('/custom-endpoint', [Controller::class, 'method']);
```

2. **Create controller method**:
```php
public function method(Request $request)
{
    return response()->json(['data' => 'value']);
}
```

3. **Test with Bruno** or curl

### Add a New Page to Frontend

1. **Create page component** in `src/pages/`:
```tsx
export function NewPage() {
  return <div>New Page</div>
}
```

2. **Add route** in `App.tsx`:
```tsx
<Route path="/new-page" component={NewPage} />
```

3. **Add navigation link** if needed

### Update Database Schema

1. **Create migration**:
```bash
php artisan make:migration add_field_to_table
```

2. **Edit migration file**:
```php
public function up()
{
    Schema::table('visitors', function (Blueprint $table) {
        $table->string('new_field')->nullable();
    });
}
```

3. **Run migration**:
```bash
php artisan migrate
```

4. **Update model** `$fillable` array

---

## Troubleshooting

### Backend Issues

#### Port Already in Use
```bash
# Kill process using port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000   # Windows
```

#### Database Connection Error
```bash
# Check .env database settings
# For SQLite, ensure database file exists
touch database/database.sqlite
php artisan migrate
```

#### CORS Issues
```bash
# Check SANCTUM_STATEFUL_DOMAINS in .env
# Ensure frontend URL is included
```

#### 500 Server Error
```bash
# Check logs
tail -f storage/logs/laravel.log

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Frontend Issues

#### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### API 404 Errors
```bash
# Check VITE_API_URL in .env
# Ensure backend is running
# Check browser network tab for actual URL being called
```

#### Build Errors
```bash
# Check TypeScript errors
npm run check

# Clear cache
rm -rf dist node_modules/.vite
npm run dev
```

---

## Contributing

### Git Workflow

1. **Create feature branch**:
```bash
git checkout -b feature/new-feature
```

2. **Make changes and commit**:
```bash
git add .
git commit -m "feat: add new feature"
```

3. **Push and create PR**:
```bash
git push origin feature/new-feature
```

### Commit Message Convention

Follow **Conventional Commits**:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add visitor photo upload
fix: correct check-in time validation
docs: update API documentation
refactor: simplify visit creation logic
```

---

## Useful Commands Reference

### Backend (Laravel)

```bash
# Artisan
php artisan list                          # List all commands
php artisan tinker                        # Interactive REPL
php artisan route:list                    # List all routes
php artisan migrate:status                # Migration status
php artisan db:seed                       # Run seeders
php artisan storage:link                  # Create storage symlink
php artisan queue:work                    # Process queue jobs

# Composer
composer install                          # Install dependencies
composer update                           # Update dependencies
composer dump-autoload                    # Regenerate autoload files
```

### Frontend (React/Vite)

```bash
# npm
npm install                               # Install dependencies
npm run dev                               # Start dev server
npm run build                             # Build for production
npm run preview                           # Preview production build
npm run check                             # TypeScript type check
```

---

## Additional Resources

### Documentation
- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)
- [TanStack Query](https://tanstack.com/query)

### Tools
- [Laravel Herd](https://herd.laravel.com/)
- [Bruno API Client](https://www.usebruno.com/)
- [TablePlus](https://tableplus.com/)

---

## Support

For questions and issues:
1. Check this documentation
2. Review existing code examples
3. Check logs (backend: `storage/logs/`, frontend: browser console)
4. Contact the development team

---

© BethLog Information Systems Limited
