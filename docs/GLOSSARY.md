# VisitorVault - Glossary

A comprehensive glossary of terms, acronyms, and concepts used throughout the VisitorVault project and documentation.

---

## A

### API (Application Programming Interface)
A set of rules and protocols that allows different software applications to communicate with each other. VisitorVault uses a RESTful API for backend-frontend communication.

### API Token
An authentication credential used to access protected API endpoints. Generated using Laravel Sanctum.

### Artisan
Laravel's command-line interface tool. Used for database migrations, cache management, and other development tasks.

### Authentication
The process of verifying user identity. VisitorVault uses token-based authentication via Laravel Sanctum.

### Authorization
The process of determining what actions an authenticated user is permitted to perform based on their role.

---

## B

### Badge Number
A unique identifier assigned to a visitor for physical identification during their visit.

### Backend
The server-side of the application, built with Laravel PHP framework. Handles business logic, database operations, and API endpoints.

### Bearer Token
An authentication method where the token is included in the HTTP Authorization header as "Bearer {token}".

---

## C

### Check-in
The process of recording when a visitor arrives at the facility. Creates or updates a visit record with check-in timestamp.

### Check-out
The process of recording when a visitor leaves the facility. Updates the visit record with check-out timestamp.

### Company
An organization associated with visitors. Visitors can be linked to companies for better organization.

### Composer
A dependency management tool for PHP. Used to install Laravel and other PHP packages.

### CORS (Cross-Origin Resource Sharing)
A security feature that controls which domains can access your API. Configured in Laravel backend.

### CRUD
Create, Read, Update, Delete - the four basic operations of persistent storage.

### CSV (Comma-Separated Values)
A file format used for exporting tabular data, such as visitor reports.

---

## D

### Dashboard
The main interface showing statistics and overview information for hosts and administrators.

### Database Migration
A version-controlled way to modify database schema. Laravel migrations are stored in `database/migrations/`.

### Database Seeder
A class that populates the database with test or initial data. Used for development and testing.

### Docker
A containerization platform. Laravel Sail uses Docker for development environments.

### DTO (Data Transfer Object)
An object that carries data between processes. Often used in API responses.

---

## E

### Eloquent ORM
Laravel's Object-Relational Mapper for database interactions. Allows working with database records as PHP objects.

### Environment Variables
Configuration values stored in `.env` file. Includes database credentials, API keys, and application settings.

### ESLint
A JavaScript/TypeScript linting tool that enforces code quality standards in the frontend.

---

## F

### Factory
A class that generates fake data for testing. Laravel factories use Faker library.

### Frontend
The client-side of the application, built with React and TypeScript. Handles user interface and interactions.

### Foreign Key
A database column that references the primary key of another table, establishing a relationship.

---

## G

### Git
A version control system used to track code changes and collaborate.

### Guard
An authentication guard in Laravel that defines how users are authenticated for each request.

---

## H

### Herd
Laravel Herd - a native PHP development environment for macOS and Windows.

### Host
A user role representing an employee who receives visitors. Hosts can approve visitor requests and manage their visits.

### HTTP Methods
Standard request methods: GET (retrieve), POST (create), PUT/PATCH (update), DELETE (remove).

---

## I

### Index
A database structure that improves query performance. Laravel migrations can define indexes on columns.

### ISO 8601
International standard for date and time representation (YYYY-MM-DDTHH:MM:SS).

---

## J

### JSON (JavaScript Object Notation)
A lightweight data format used for API request and response bodies.

### JWT (JSON Web Token)
A compact token format for authentication. VisitorVault uses Sanctum tokens instead.

---

## L

### Laravel
A PHP web application framework used for the VisitorVault backend.

### Livewire
A Laravel framework for building dynamic interfaces (not used in VisitorVault).

### Localhost
The local computer, typically accessed via `http://localhost` or `http://127.0.0.1`.

---

## M

### Middleware
Software that runs before or after HTTP request handling. Used for authentication, CORS, etc.

### Migration
See Database Migration.

### Model
A class representing a database table in Laravel's Eloquent ORM.

### MySQL
An open-source relational database management system. Recommended for VisitorVault production.

---

## N

### Nginx
A high-performance web server and reverse proxy. Recommended for production deployment.

### Node.js
JavaScript runtime used for building and running the React frontend.

### npm (Node Package Manager)
Package manager for JavaScript. Used to install frontend dependencies.

### Notification
A message sent to users, typically via email or in-app alerts.

---

## O

### ORM (Object-Relational Mapping)
A technique to interact with databases using object-oriented programming. See Eloquent ORM.

### OTP (One-Time Password)
A temporary password valid for a single login session or transaction.

---

## P

### Pagination
Dividing large datasets into pages for better performance and user experience.

### PHP
A server-side scripting language used for Laravel backend development.

### PHPUnit
A testing framework for PHP. Used for VisitorVault backend tests.

### Pending Status
A visitor status indicating their visit request is awaiting approval.

### PostgreSQL
An open-source relational database. Alternative to MySQL for production.

### PSR-12
PHP Standards Recommendation for coding style. Used in VisitorVault backend.

---

## Q

### QR Code
A two-dimensional barcode assigned to visitors for quick identification.

### Query Builder
Laravel's fluent interface for building database queries.

### Queue
A system for deferring time-consuming tasks like sending emails. Can use database, Redis, or other drivers.

---

## R

### Radix UI
A library of unstyled, accessible UI components used in the React frontend.

### React
A JavaScript library for building user interfaces. Used for VisitorVault frontend.

### React Hook Form
A library for managing forms in React with validation.

### React Query (TanStack Query)
A library for managing server state and data fetching in React.

### Reception
A user role for front desk staff who check visitors in and out.

### Redis
An in-memory data store used for caching, sessions, and queues.

### RESTful API
An API architectural style using HTTP methods and URIs to perform CRUD operations.

### Role
A user classification (admin, host, reception) that determines permissions.

### Route
A URL pattern mapped to a controller action. Defined in `routes/api.php` or `routes/web.php`.

---

## S

### Sanctum
Laravel's lightweight authentication system for SPAs and mobile apps. Provides API token authentication.

### Seeder
See Database Seeder.

### Session
A way to preserve user state across HTTP requests.

### SPA (Single Page Application)
A web application that loads a single HTML page and dynamically updates content. VisitorVault frontend is an SPA.

### SQLite
A lightweight, file-based database. Used for VisitorVault development.

### SSL/TLS
Security protocols for encrypting web traffic. Required for production (HTTPS).

### Status
The approval state of a visitor: pending, approved, or rejected.

---

## T

### Tailwind CSS
A utility-first CSS framework used for styling the React frontend.

### Tinker
Laravel's interactive REPL for testing code and database queries.

### Token
See API Token.

### TypeScript
A typed superset of JavaScript used for the React frontend.

---

## U

### URI (Uniform Resource Identifier)
A string that identifies a resource, typically a URL.

### UUID (Universally Unique Identifier)
A 128-bit identifier guaranteed to be unique. Can be used for primary keys.

---

## V

### Validation
The process of ensuring data meets specified rules before processing.

### Vite
A modern build tool and dev server used for the React frontend.

### Visit
An individual record of a visitor's check-in and check-out at the facility.

### Visitor
A person visiting the facility. Has personal information and can have multiple visits.

---

## W

### Webhook
An HTTP callback triggered by an event. Not currently used in VisitorVault.

### Wouter
A minimalist routing library used in the React frontend.

---

## Z

### Zod
A TypeScript-first schema validation library used for form validation.

---

## Common Acronyms

| Acronym | Full Form | Description |
|---------|-----------|-------------|
| API | Application Programming Interface | Interface for software communication |
| CORS | Cross-Origin Resource Sharing | Security mechanism for API access |
| CRUD | Create, Read, Update, Delete | Basic database operations |
| CSV | Comma-Separated Values | Data export format |
| DTO | Data Transfer Object | Object for data transfer |
| FK | Foreign Key | Database relationship reference |
| HTTP | Hypertext Transfer Protocol | Web communication protocol |
| JSON | JavaScript Object Notation | Data interchange format |
| JWT | JSON Web Token | Authentication token format |
| NPM | Node Package Manager | JavaScript package manager |
| ORM | Object-Relational Mapping | Database abstraction layer |
| OTP | One-Time Password | Temporary authentication code |
| PK | Primary Key | Unique table identifier |
| QR | Quick Response | 2D barcode type |
| REST | Representational State Transfer | API architecture style |
| SPA | Single Page Application | Web app type |
| SQL | Structured Query Language | Database query language |
| SSL/TLS | Secure Sockets Layer / Transport Layer Security | Encryption protocols |
| UI | User Interface | Visual elements of application |
| URI | Uniform Resource Identifier | Resource identifier |
| URL | Uniform Resource Locator | Web address |
| UUID | Universally Unique Identifier | Unique identifier format |

---

## VisitorVault-Specific Terms

### Active Visit
A visit where the visitor has checked in but not yet checked out.

### Badge Assignment
The process of assigning a unique badge number to a visitor during check-in.

### Emergency Checkout
A feature to check out all currently checked-in visitors at once (for emergencies or end-of-day).

### Host Dashboard
The main interface for hosts to manage their visitors and view statistics.

### Reception Interface
The interface used by reception staff for checking visitors in and out.

### Visit Date
The scheduled or actual date of a visit.

### Visit Duration
The time between check-in and check-out timestamps.

### Visitor Approval Workflow
The process where visitors register and await host approval before visiting.

### Visitor Registration
The public-facing form where visitors submit their information and visit request.

---

## Technical Patterns

### Repository Pattern
A design pattern that abstracts data access logic (not explicitly used in VisitorVault but common in Laravel).

### Service Layer
Business logic separated from controllers (can be implemented for complex operations).

### Factory Pattern
Used in Laravel factories to generate test data.

### Observer Pattern
Laravel event system for responding to model events.

---

© BethLog Information Systems Limited
