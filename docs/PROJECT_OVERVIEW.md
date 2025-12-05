# VisitorVault - Project Overview

## Description
VisitorVault is a comprehensive visitor management system designed to streamline visitor registration, check-in, check-out, and tracking processes for organizations. The system features a modern web interface with role-based access control for administrators, hosts, and reception staff.

## Project Purpose
To provide a secure, efficient, and user-friendly visitor management solution that:
- Tracks visitor information and visit history
- Manages visitor approval workflows
- Facilitates easy check-in/check-out processes
- Generates visitor badges and QR codes
- Provides analytics and reporting capabilities
- Ensures security through role-based access control

## Architecture

### Full-Stack Application Structure
```
VisitorVault/
├── backend/          # Laravel 12 REST API
├── frontend/         # React + TypeScript SPA
├── visitapis/        # Bruno API testing collection
└── PROJECT_DOCS/     # Documentation files
```

### Technology Stack

#### Backend
- **Framework**: Laravel 12 (PHP 8.2+)
- **Authentication**: Laravel Sanctum (token-based)
- **Database**: SQLite (development), supports MySQL/PostgreSQL
- **Key Dependencies**:
  - Laravel Framework ^12.0
  - Laravel Sanctum ^4.0
  - Laravel Tinker ^2.10.1

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Key Features**:
  - QR code generation
  - Photo capture
  - Date picker
  - Charts and analytics (Recharts)
  - Toast notifications
  - Responsive design

#### API Testing
- **Tool**: Bruno (modern API client)
- **Collections**: Auth, Dashboard, Visitor endpoints

## Core Features

### 1. User Management
- **Roles**: Admin, Host, Reception
- User registration and authentication
- Role-based access control
- User profile management

### 2. Visitor Management
- Public visitor registration
- Visitor approval workflow (pending, approved, rejected)
- Visitor search and filtering
- Badge assignment
- Photo capture
- QR code generation

### 3. Visit Tracking
- Create, read, update, delete visits
- Check-in/check-out functionality
- Visit history per visitor
- Active visit tracking
- Visit statistics and analytics
- Emergency checkout (all visitors)
- Daily visit reports (export capability)

### 4. Company Management
- Company registration
- Associate visitors with companies
- Company-based filtering

### 5. Dashboard & Analytics
- Real-time visitor statistics
- Activity logs
- Visit duration tracking
- Check-in/out reports
- Visual charts and graphs

## Database Schema

### Key Tables

#### users
- User authentication and profile
- Role assignment (admin, host, reception)
- Relationship to visits as hosts

#### visitors
- Visitor personal information
- Approval status (pending, approved, rejected)
- Badge number
- Photo storage
- Associated company
- Relationship to multiple visits

#### visits
- Individual visit records
- Foreign keys: visitor_id, user_id (host)
- Visit date
- Check-in/check-out timestamps
- Notes and badge number
- Created/updated timestamps

#### companies
- Company information
- Relationship to visitors

## API Architecture

### Public Endpoints
- `POST /api/visitor/register` - Register new visitor
- `POST /api/visitor/find-by-email-or-phone` - Find existing visitor
- `POST /api/visitor/{visitor}/create-visit` - Create visit for visitor
- `GET /api/companies` - List companies
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Protected Endpoints (requires authentication)

#### User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `PATCH /api/users/{id}/toggle-status` - Toggle user status

#### Dashboard
- `GET /api/dashboard` - Dashboard statistics
- `GET /api/activity-logs` - Activity logs

#### Visitors
- `GET /api/visitors` - List visitors
- `GET /api/visitors/checked-in` - Currently checked-in visitors
- `GET /api/visitors/search` - Search visitors
- `GET /api/visitors/badge/{badgeNumber}` - Find by badge
- `GET /api/visitor/{visitor}` - Get visitor details
- `PATCH /api/visitor/{visitor}` - Update visitor
- `DELETE /api/visitor/{visitor}` - Delete visitor

#### Visits
- `GET /api/visits` - List visits with filtering
- `POST /api/visits` - Create visit
- `GET /api/visits/checked-in` - Currently checked-in visits
- `GET /api/visits/statistics` - Visit statistics
- `POST /api/visits/check-in-visitor` - Check in visitor
- `POST /api/visits/check-out-visitor` - Check out visitor
- `POST /api/visits/emergency-checkout-all` - Emergency checkout all
- `GET /api/visits/export-today-report` - Export daily report
- `GET /api/visits/{visit}` - Get visit details
- `PATCH /api/visits/{visit}` - Update visit
- `DELETE /api/visits/{visit}` - Delete visit
- `PATCH /api/visits/{visit}/check-in` - Check in specific visit
- `PATCH /api/visits/{visit}/check-out` - Check out specific visit

#### Companies
- `POST /api/companies` - Create company
- `GET /api/companies/{company}` - Get company
- `PUT /api/companies/{company}` - Update company
- `DELETE /api/companies/{company}` - Delete company

## Frontend Pages

### Public Pages
1. **Landing Page** (`landing.tsx`) - Marketing/info page
2. **Visitor Registration** (`visitor-registration.tsx`) - Multi-step visitor registration with photo capture and QR code generation

### Authenticated Pages
1. **Home** (`home.tsx`) - Main dashboard
2. **Host Dashboard** (`host-dashboard.tsx`) - Host view for managing visitors and visits
3. **Reception Interface** (`reception-interface.tsx`) - Reception desk check-in/out interface
4. **Admin Panel** (`admin-panel.tsx`) - System administration
5. **Staff Login** (`staff-login.tsx`) - Authentication for staff

## Key Components

### UI Components (Radix-based)
- Alerts, Dialogs, Modals
- Forms, Inputs, Selects
- Tables, Cards, Tabs
- Charts, Calendars, Carousels
- Toast notifications
- Navigation menus
- And 40+ more UI primitives

### Custom Components
- **Header** (`header.tsx`) - Navigation header
- **Photo Capture Modal** (`photo-capture-modal.tsx`) - Capture visitor photos
- **QR Display Modal** (`qr-display-modal.tsx`) - Display visitor QR codes
- **Role Tabs** (`role-tabs.tsx`) - Role switching interface

## Development Workflow

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Configuration
- **Backend**: Uses Laravel Herd - `http://visitvault.test`
- **Frontend**: Development server - `http://localhost:5173`
- **API Base URL**: Configured via `VITE_API_URL` (default: `http://visitvault.test/api`)

## Recent Major Changes

### Visits Migration (July 2025)
The system underwent a significant architectural change from a single visitor table with check-in/out fields to a separate visits table:

**Benefits:**
- Multiple visits per visitor tracking
- Better historical data
- Improved analytics
- Maintained backward compatibility

**Changes:**
- New `visits` table created
- Removed `check_in_time` and `check_out_time` from `visitors` table
- Updated API endpoints from `/visitor/{visitor}/check-in` to `/visits/{visit}/check-in`
- New `VisitController` with comprehensive visit management
- Updated frontend to use new visit-based APIs

See [VISITS_MIGRATION_SUMMARY.md](file:///c:/Users/sever/OneDrive/Documents/code/work/VisitorVault/VISITS_MIGRATION_SUMMARY.md) for detailed migration information.

## Testing

### Backend Testing
```bash
cd backend
php artisan test
```

### API Testing
- Use Bruno API client with the collection in `visitapis/`
- Pre-configured endpoints for Auth, Dashboard, and Visitor operations

## Security

- **Authentication**: Token-based authentication using Laravel Sanctum
- **Authorization**: Role-based access control (Admin, Host, Reception)
- **CORS**: Configured CORS middleware for cross-origin requests
- **Validation**: Request validation using Laravel Form Requests
- **Protected Routes**: All sensitive endpoints require authentication

## Deployment Considerations

- SQLite for development, migrate to MySQL/PostgreSQL for production
- Configure `VITE_API_URL` for production API endpoint
- Build frontend: `npm run build` (outputs to `dist/`)
- Serve backend with proper web server (Nginx/Apache)
- Configure CORS for production domains
- Set up proper database backups
- Configure mail server for notifications

## Future Enhancements

1. Email notifications for visitor approvals
2. SMS notifications
3. Visitor pre-registration portal
4. Advanced analytics dashboard
5. Integration with access control systems
6. Mobile application
7. Visitor badges printing integration
8. Multi-language support

## Contact & Support

© BethLog Information Systems Limited
Website: [desiderata.com](https://desiderata.com)

## License

MIT License
