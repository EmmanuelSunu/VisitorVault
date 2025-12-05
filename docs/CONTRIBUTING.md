# Contributing to VisitorVault

Thank you for your interest in contributing to VisitorVault! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Messages](#commit-messages)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)
8. [Documentation](#documentation)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Acknowledge different viewpoints and experiences

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting/derogatory comments
- Publishing others' private information
- Unprofessional conduct

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Read the [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- Set up your development environment
- Familiarized yourself with the codebase

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/VisitorVault.git
   cd VisitorVault
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/VisitorVault.git
   ```

4. **Set up backend**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   ```

5. **Set up frontend**
   ```bash
   cd ../frontend
   npm install
   ```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- **Features**: `feature/short-description`
- **Bug fixes**: `fix/short-description`
- **Documentation**: `docs/short-description`
- **Refactoring**: `refactor/short-description`
- **Tests**: `test/short-description`

Examples:
- `feature/sms-notifications`
- `fix/badge-generation-bug`
- `docs/api-endpoints`

### 2. Make Your Changes

- Write clean, readable code
- Follow coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Backend tests
cd backend
php artisan test

# Frontend type checking
cd frontend
npm run check

# Manual testing
# Test the feature thoroughly in your browser
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add SMS notification support"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Fill out the PR template
- Request review from maintainers

---

## Coding Standards

### PHP (Backend)

Follow **PSR-12** coding standard.

```bash
# Check code style
./vendor/bin/pint --test

# Fix code style
./vendor/bin/pint
```

**Key Rules:**
- Use type hints for parameters and return types
- Document classes and methods with PHPDoc
- Use meaningful variable names
- Keep methods focused and small
- Follow Laravel best practices

**Example:**

```php
<?php

namespace App\Http\Controllers;

use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitorController extends Controller
{
    /**
     * Display a listing of visitors.
     */
    public function index(Request $request): JsonResponse
    {
        $visitors = Visitor::query()
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->paginate(15);

        return response()->json($visitors);
    }
}
```

### TypeScript/React (Frontend)

Follow **ESLint** and **Prettier** configurations.

```bash
# Type check
npm run check
```

**Key Rules:**
- Use TypeScript for type safety
- Use functional components with hooks
- Props should have TypeScript interfaces
- Use meaningful component and variable names
- Keep components focused and reusable

**Example:**

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface VisitorFormProps {
  onSubmit: (data: VisitorData) => void
  isLoading?: boolean
}

export function VisitorForm({ onSubmit, isLoading = false }: VisitorFormProps) {
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
      <Button type="submit" disabled={isLoading}>
        Submit
      </Button>
    </form>
  )
}
```

---

## Commit Messages

Follow **Conventional Commits** specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
# Simple feature
git commit -m "feat: add email notification for visitor approval"

# Bug fix with scope
git commit -m "fix(auth): resolve token expiration issue"

# Breaking change
git commit -m "feat!: change API endpoint structure

BREAKING CHANGE: visitor check-in endpoint moved from /visitor to /visits"

# With body
git commit -m "refactor: simplify visit creation logic

Extracted visit creation into a separate service class
to improve code reusability and testability."
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass
- [ ] New functionality has tests
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts with main branch

### PR Template

When creating a PR, include:

**Title:** Follow commit message format
```
feat: add SMS notification support
```

**Description:**
```markdown
## Description
Adds SMS notification functionality for visitor approvals.

## Changes
- Added Twilio integration
- Created SMS notification template
- Updated visitor approval workflow
- Added configuration for SMS credentials

## Testing
- [ ] Unit tests added
- [ ] Integration tests pass
- [ ] Manually tested with test phone number

## Related Issues
Closes #123

## Screenshots (if applicable)
[Add screenshots of UI changes]
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests
2. **Code Review**: Maintainers review your code
3. **Feedback**: Address any requested changes
4. **Approval**: PR is approved by maintainers
5. **Merge**: PR is merged into main branch

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "refactor: apply review feedback"
git push origin feature/your-feature-name
```

---

## Testing

### Backend Testing

```bash
cd backend

# Run all tests
php artisan test

# Run specific test
php artisan test tests/Feature/VisitorTest.php

# Run with coverage
php artisan test --coverage
```

### Writing Tests

Create tests for new features:

```bash
# Create feature test
php artisan make:test VisitorNotificationTest
```

**Example Test:**

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Visitor;

class VisitorTest extends TestCase
{
    public function test_can_approve_visitor(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $visitor = Visitor::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($user)
            ->patchJson("/api/visitor/{$visitor->id}", [
                'status' => 'approved'
            ]);

        $response->assertStatus(200);
        $this->assertEquals('approved', $visitor->fresh()->status);
    }
}
```

### Frontend Testing

(Add when testing framework is set up)

---

## Documentation

### When to Update Documentation

Update documentation when:

- Adding new features
- Changing API endpoints
- Modifying database schema
- Updating deployment process
- Changing environment variables

### Which Documents to Update

- **API_DOCUMENTATION.md**: API changes
- **DATABASE_SCHEMA.md**: Database changes
- **DEVELOPER_GUIDE.md**: Development workflow changes
- **DEPLOYMENT_GUIDE.md**: Deployment changes
- **CHANGELOG.md**: All changes
- **README.md**: Major changes

### Documentation Standards

- Use clear, concise language
- Include code examples
- Keep formatting consistent
- Update table of contents
- Test all code examples

---

## Feature Development Checklist

When developing a new feature, ensure:

- [ ] Feature branch created from latest main
- [ ] Code written following standards
- [ ] Unit tests written
- [ ] Integration tests written (if applicable)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No console errors or warnings
- [ ] Responsive design (if UI change)
- [ ] Accessibility considered
- [ ] Performance impact assessed
- [ ] Security implications reviewed
- [ ] Pull request created with description
- [ ] Tests passing in CI/CD
- [ ] Code review requested

---

## Bug Fix Checklist

When fixing a bug:

- [ ] Issue exists for the bug
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Test added to prevent regression
- [ ] Manually tested
- [ ] Related areas tested
- [ ] CHANGELOG.md updated
- [ ] Commit message references issue number
- [ ] Pull request created

---

## Getting Help

### Resources

- **Documentation**: Check [README.md](README.md) for documentation links
- **Developer Guide**: See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **API Reference**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

### Contact

- Open an issue for bugs or feature requests
- Contact maintainers for questions
- Join development discussions

---

## Recognition

Contributors will be recognized in:

- Project README
- Release notes
- Special thanks section

Thank you for contributing to VisitorVault! 🎉

---

© BethLog Information Systems Limited
