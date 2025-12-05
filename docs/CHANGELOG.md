# Changelog

All notable changes to the VisitorVault project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive project documentation suite
  - PROJECT_OVERVIEW.md
  - REQUIREMENTS.md
  - DEVELOPER_GUIDE.md
  - API_DOCUMENTATION.md
  - DATABASE_SCHEMA.md
  - DEPLOYMENT_GUIDE.md
  - README.md (documentation index)

## [2.0.0] - 2025-07-19

### Added
- New `visits` table for individual visit tracking
- `VisitController` for comprehensive visit management
- Visit statistics and analytics endpoints
- Emergency checkout all functionality
- Daily visit report export capability
- Multiple visit support per visitor

### Changed
- **BREAKING**: Migrated from single visitor check-in/out to visit-based system
- Updated API endpoints from `/visitor/{visitor}/check-in` to `/visits/{visit}/check-in`
- Frontend updated to use visit-based APIs
- Dashboard now uses visits table for statistics

### Removed
- **BREAKING**: Removed `check_in_time` and `check_out_time` from `visitors` table
- Deprecated visitor-level check-in/out endpoints

### Migration
- See [VISITS_MIGRATION_SUMMARY.md](VISITS_MIGRATION_SUMMARY.md) for detailed migration information

## [1.0.0] - 2025-01-15

### Added
- Initial release of VisitorVault
- Visitor registration system
- Host dashboard
- Reception check-in/check-out interface
- Admin panel
- User management with role-based access
- Company management
- Email notifications
- QR code generation for visitors
- Photo capture functionality
- Laravel Sanctum authentication
- React + TypeScript frontend
- Tailwind CSS styling
- Mobile-responsive design

### Features
- Public visitor registration
- Visitor approval workflow (pending, approved, rejected)
- Badge assignment
- Activity logging
- Dashboard analytics
- Search and filtering
- Multi-step registration form

### Technical
- Laravel 12 backend
- React 18 frontend
- SQLite database (development)
- MySQL/PostgreSQL support (production)
- RESTful API architecture
- Token-based authentication

## Version History

- **2.0.0** - Visit tracking system (July 2025)
- **1.0.0** - Initial release (January 2025)

---

## How to Update This Changelog

When making changes to the project, update this file following these guidelines:

### Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes

### Version Numbers

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR** - Incompatible API changes
- **MINOR** - New functionality (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Format

```markdown
## [Version] - YYYY-MM-DD

### Category
- Brief description of change
- Link to PR/issue if applicable
```

### Example Entry

```markdown
## [2.1.0] - 2025-08-15

### Added
- SMS notification support for visitor approvals (#123)
- Export visitors to CSV functionality (#125)

### Fixed
- Check-in time not updating correctly (#121)
- Badge number generation collision (#124)

### Changed
- Improved dashboard loading performance (#126)
```

---

© BethLog Information Systems Limited
