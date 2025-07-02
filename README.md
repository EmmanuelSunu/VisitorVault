# VisitorVault - Visitor Management System

A modern visitor management system built with React, TypeScript, and MySQL.

## Features

- **Visitor Registration**: Easy visitor check-in with photo capture
- **QR Code Generation**: Automatic QR code generation for visitors
- **Host Dashboard**: Manage and approve visitor requests
- **Reception Interface**: Streamlined check-in/check-out process
- **Admin Panel**: Complete system management
- **Real-time Tracking**: Monitor visitor activity and statistics

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL (Remote server)
- **ORM**: Drizzle ORM
- **Authentication**: Session-based authentication
- **Build Tool**: Vite

## Quick Setup

### Prerequisites

- Node.js 18+ and npm
- Access to remote MySQL server

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VisitorVault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   The `.env` file should contain:
   ```env
   DATABASE_URL=mysql://u592761690_vvsunu:4U1sE8I~!D=n@srv1959.hstgr.io:3306/u592761690_VisitorVault
   SESSION_SECRET=your-session-secret-here
   NODE_ENV=development
   ```

4. **Set up the database**
   - Connect to your MySQL server
   - Execute the `database-setup.sql` script
   - This will create all tables and sample data

5. **Start the development server**
   ```bash
   npm run dev:mysql
   ```

6. **Access the application**
   - Open http://localhost:5000 in your browser

## Database Setup

The application uses a remote MySQL server with the following credentials:

- **Host**: srv1959.hstgr.io
- **Database**: u592761690_VisitorVault
- **Username**: u592761690_vvsunu
- **Password**: 4U1sE8I~!D=n

### Database Schema

- **users**: System users (admin, host, reception)
- **visitors**: Visitor information
- **locations**: Office locations and meeting rooms
- **visit_requests**: Visit requests and approvals
- **visit_logs**: Activity tracking and audit logs
- **sessions**: User session storage

## Available Scripts

- `npm run dev:mysql` - Start development server with MySQL
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate:mysql` - Generate MySQL migrations
- `npm run db:push:mysql` - Push migrations to MySQL database

## Authentication

The system uses session-based authentication with the following default credentials:

- **Admin**: admin@company.com / demo123
- **Host**: john.doe@company.com / demo123
- **Reception**: reception@company.com / demo123

## Project Structure

```
VisitorVault/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── auth.ts            # Authentication
│   └── db-mysql.ts        # MySQL configuration
├── shared/                # Shared types and schemas
│   └── schema-mysql.ts    # MySQL database schema
└── database-setup.sql     # Database initialization script
```

## Development

### Adding New Features

1. Update the database schema in `shared/schema-mysql.ts`
2. Add corresponding storage methods in `server/storage.ts`
3. Create API routes in `server/routes.ts`
4. Build the frontend components in `client/src/`

### Database Migrations

```bash
# Generate new migration
npm run db:generate:mysql

# Apply migrations
npm run db:push:mysql
```

## Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Update the `SESSION_SECRET` to a secure value
3. Build the application: `npm run build`
4. Start the production server: `npm run start`

## Security Notes

- Change default passwords in production
- Use HTTPS in production
- Regularly backup your database
- Keep dependencies updated
- Use environment variables for sensitive data

## Support

For issues and questions, please refer to the documentation or create an issue in the repository. 