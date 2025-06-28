# Visitor Management System

## Overview

A modern full-stack visitor management system built with React, Express, and PostgreSQL. The application provides role-based access control for managing visitor registration, check-in/check-out processes, and administrative oversight. Features include photo capture, QR code generation for visitor badges, and real-time visitor tracking.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (OIDC) with Replit Auth integration
- **Session Management**: Express sessions stored in PostgreSQL
- **API Design**: RESTful endpoints with role-based access control

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Key Components

### Authentication & Authorization
- **Provider**: Replit OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Role System**: Three-tier access control (admin, host, reception)
- **Security**: HTTP-only cookies, CSRF protection, secure session handling

### Database Schema
- **Users**: OIDC-compatible user profiles with role assignment
- **Locations**: Multi-location support with active/inactive states
- **Visitors**: Comprehensive visitor information with photo storage
- **Visit Requests**: Approval workflow with status tracking
- **Visit Logs**: Audit trail for check-in/check-out activities

### Frontend Features
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Photo Capture**: Browser-based camera integration for visitor photos
- **QR Code Generation**: Dynamic badge creation with visit information
- **Real-time Updates**: Automatic data refresh for reception interfaces
- **Progressive Enhancement**: Graceful degradation for older browsers

### API Endpoints
- `/api/auth/*` - Authentication flow management
- `/api/users/*` - User management (admin only)
- `/api/visitors/*` - Visitor registration and search
- `/api/visit-requests/*` - Visit approval and tracking
- `/api/locations/*` - Location management
- `/api/stats/*` - Dashboard statistics

## Data Flow

### Visitor Registration Process
1. Anonymous visitor fills registration form
2. Photo capture using browser camera API
3. Host selection and approval request creation
4. Email notification to selected host
5. Host approval/rejection through dashboard
6. QR code generation for approved visits

### Check-in/Check-out Flow
1. Reception scans QR code or manual badge lookup
2. System validates visit request status
3. Photo verification against registered image
4. Location assignment and access control
5. Real-time status updates across interfaces
6. Automated log creation for audit trail

### Role-based Interface Routing
- **Admin**: Full system access, user management, system statistics
- **Host**: Visit request management, today's schedule, approval workflows
- **Reception**: Check-in/out interface, visitor search, real-time monitoring
- **Anonymous**: Public visitor registration form only

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit OIDC provider
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React icon library
- **Date Handling**: date-fns utility library

### Camera & QR Code Libraries
- **Camera Access**: Native Web APIs (getUserMedia)
- **QR Generation**: Custom implementation with canvas rendering
- **Image Processing**: Browser-native canvas operations

### Development Tools
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier integration
- **Build Optimization**: Vite bundling with tree shaking
- **Development Experience**: Hot reload and error overlay

## Deployment Strategy

### Build Process
- **Frontend**: Vite production build to `dist/public`
- **Backend**: ESBuild bundling to `dist/index.js`
- **Assets**: Static file serving through Express
- **Environment**: Production/development configuration switching

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit authentication identifier
- `ISSUER_URL`: OIDC provider endpoint
- `NODE_ENV`: Environment specification

### Production Considerations
- **Database**: Connection pooling with Neon serverless
- **Sessions**: PostgreSQL-backed session persistence
- **Security**: HTTPS enforcement, secure headers
- **Performance**: Static asset caching, query optimization

## Changelog

- June 28, 2025. Initial setup
- June 28, 2025. Fixed camera initialization and created visitor-focused wizard form
- June 28, 2025. Resolved camera display issues with video element rendering

## User Preferences

Preferred communication style: Simple, everyday language.