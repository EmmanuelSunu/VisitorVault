# VisitorVault - Documentation Index

## Project Documentation

This directory contains comprehensive documentation for the VisitorVault visitor management system.

---

## Quick Links

### 📋 Getting Started
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Complete project overview, architecture, and features
- **[REQUIREMENTS.md](REQUIREMENTS.md)** - Technical requirements, dependencies, and environment setup
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Developer setup, coding standards, and common tasks

### 🚀 Development
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API endpoint reference with examples
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Database schema, relationships, and query examples
- **[VISITS_MIGRATION_SUMMARY.md](VISITS_MIGRATION_SUMMARY.md)** - Details of the visits table migration (July 2025)

### 🌐 Deployment
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment, configuration, and maintenance

### 📝 Project Management
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines and workflow
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick command reference and cheat sheet

### 📖 Reference & Support
- **[GLOSSARY.md](GLOSSARY.md)** - Technical terms, acronyms, and definitions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

---

## Documentation Overview

### 1. PROJECT_OVERVIEW.md
**What it covers:**
- Project description and purpose
- Architecture and technology stack
- Core features and functionality
- Database schema overview
- API architecture
- Frontend pages and components
- Recent major changes
- Future enhancements

**Best for:**
- Understanding the overall project
- Onboarding new developers
- Project stakeholders
- High-level technical overview

---

### 2. REQUIREMENTS.md
**What it covers:**
- System requirements (development & production)
- Complete dependency list with descriptions
- Backend dependencies (Composer)
- Frontend dependencies (npm)
- Database requirements
- Environment variables
- Installation dependencies
- Build requirements
- Browser requirements
- Network requirements
- Security requirements
- Deployment requirements

**Best for:**
- Setting up development environment
- Planning production infrastructure
- Understanding dependencies
- Troubleshooting compatibility issues

---

### 3. DEVELOPER_GUIDE.md
**What it covers:**
- Quick start guide
- Development environment setup
- Project structure explanation
- Coding standards (PHP & TypeScript)
- Backend development practices
- Frontend development practices
- Testing procedures
- Common development tasks
- Troubleshooting guide
- Contributing guidelines
- Useful command reference

**Best for:**
- New developers joining the project
- Daily development tasks
- Code style reference
- Problem-solving during development

---

### 4. API_DOCUMENTATION.md
**What it covers:**
- Complete API endpoint reference
- Authentication flow
- Public endpoints (visitor registration, login, etc.)
- Protected endpoints (user, visitor, visit management)
- Request/response examples
- Error responses and status codes
- Rate limiting
- Pagination
- Testing with cURL and Bruno

**Best for:**
- Frontend developers integrating with the API
- API testing
- Third-party integrations
- Understanding data flow
- Debugging API issues

---

### 5. DATABASE_SCHEMA.md
**What it covers:**
- Entity-relationship diagram
- Complete table schemas
- Column descriptions and types
- Indexes and foreign keys
- Model relationships
- Migration files
- Database seeders and factories
- Query examples
- Database optimization tips
- Backup and restore procedures

**Best for:**
- Understanding data structure
- Writing database queries
- Database optimization
- Migration management
- Data modeling

---

### 6. VISITS_MIGRATION_SUMMARY.md
**What it covers:**
- Background on the visits migration
- Database changes made
- New models and controllers
- API endpoint changes
- Frontend updates
- Benefits of the new structure
- Testing status
- Migration notes

**Best for:**
- Understanding the visit tracking system
- Historical context of architectural changes
- Migration from old to new system

---

### 7. DEPLOYMENT_GUIDE.md
**What it covers:**
- Pre-deployment checklist
- Production environment requirements
- Server setup (Ubuntu)
- Backend deployment (Laravel)
- Frontend deployment (React/Vite)
- Database setup
- SSL/HTTPS configuration
- Nginx configuration
- Performance optimization
- Monitoring and maintenance
- Backup strategy
- Zero-downtime deployment
- Security checklist
- Scaling considerations

**Best for:**
- DevOps engineers
- System administrators
- Production deployment
- Server configuration
- Performance tuning
- Security hardening

---

### 8. CHANGELOG.md
**What it covers:**
- Version history
- Release notes
- Breaking changes
- New features by version
- Bug fixes and improvements
- Migration notes between versions
- Changelog maintenance guidelines

**Best for:**
- Understanding version history
- Tracking changes over time
- Planning upgrades
- Release management
- Communicating changes to stakeholders

---

### 9. CONTRIBUTING.md
**What it covers:**
- Code of Conduct
- Getting started for contributors
- Development workflow
- Coding standards (PHP & TypeScript)
- Commit message conventions
- Pull request process
- Testing requirements
- Documentation guidelines
- Feature and bug fix checklists

**Best for:**
- New contributors
- Understanding contribution process
- Maintaining code quality
- Standardizing workflows
- Team collaboration

---

### 10. QUICK_REFERENCE.md
**What it covers:**
- Common commands (backend & frontend)
- Default test credentials
- API endpoint quick reference
- Database query examples
- Debugging tips
- Git workflow shortcuts
- Environment variable reference
- Emergency procedures
- Performance tips

**Best for:**
- Daily development
- Quick command lookup
- Debugging issues
- Learning the codebase
- Rapid problem-solving

---

### 11. GLOSSARY.md
**What it covers:**
- A-Z technical terms and definitions
- Common acronyms explained (40+ acronyms)
- VisitorVault-specific terminology
- Technical patterns and concepts
- Database and API terminology

**Best for:**
- Understanding technical jargon
- New team members learning concepts
- Clarifying terminology
- Quick term lookup
- Cross-referencing documentation

---

### 12. TROUBLESHOOTING.md
**What it covers:**
- Common backend issues and solutions
- Frontend build and runtime problems
- Database connection and migration errors
- API and CORS troubleshooting
- Authentication problems
- Deployment issues
- Performance optimization
- Specific error message solutions

**Best for:**
- Debugging problems quickly
- Finding solutions to common errors
- Development troubleshooting
- Production issue resolution
- Performance optimization

---

## Document Quick Reference

| Need to... | Read this |
|------------|-----------|
| Understand what VisitorVault does | PROJECT_OVERVIEW.md |
| Set up development environment | DEVELOPER_GUIDE.md |
| Know what dependencies are needed | REQUIREMENTS.md |
| Integrate with the API | API_DOCUMENTATION.md |
| Understand database structure | DATABASE_SCHEMA.md |
| Deploy to production | DEPLOYMENT_GUIDE.md |
| Understand visit tracking | VISITS_MIGRATION_SUMMARY.md |
| Add a new feature | DEVELOPER_GUIDE.md + API_DOCUMENTATION.md |
| Optimize database queries | DATABASE_SCHEMA.md |
| Configure server | DEPLOYMENT_GUIDE.md |
| Debug API issues | API_DOCUMENTATION.md |
| Understand code architecture | PROJECT_OVERVIEW.md + DEVELOPER_GUIDE.md |

---

## Additional Resources

### Frontend Documentation
- **README**: `frontend/README.md`
- **Tech Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: Radix UI primitives
- **Key Features**: Visitor registration, host dashboard, reception interface

### Backend Documentation
- **README**: `backend/README.md` (Laravel default)
- **Framework**: Laravel 12
- **API**: RESTful API with Sanctum authentication
- **Database**: SQLite (dev), MySQL/PostgreSQL (prod)

### API Testing
- **Tool**: Bruno API Client
- **Collection**: `visitapis/` directory
- **Endpoints**: Pre-configured for auth, dashboard, visitor operations

---

## Documentation Maintenance

### Updating Documentation

When making changes to the codebase, please update relevant documentation:

1. **New Features**: Update PROJECT_OVERVIEW.md, API_DOCUMENTATION.md, DEVELOPER_GUIDE.md
2. **Database Changes**: Update DATABASE_SCHEMA.md
3. **API Changes**: Update API_DOCUMENTATION.md
4. **Deployment Changes**: Update DEPLOYMENT_GUIDE.md
5. **New Dependencies**: Update REQUIREMENTS.md

### Documentation Standards

- Use clear, concise language
- Include code examples where relevant
- Keep formatting consistent
- Update version/date information
- Test all code examples
- Link to related documentation

---

## Getting Help

### For Questions About:

**Development:**
1. Check DEVELOPER_GUIDE.md
2. Review relevant code examples
3. Check logs (backend: `storage/logs/`, frontend: console)
4. Contact development team

**API Integration:**
1. Check API_DOCUMENTATION.md
2. Test with Bruno collection
3. Review network requests in browser DevTools
4. Check backend logs

**Deployment:**
1. Check DEPLOYMENT_GUIDE.md
2. Review server logs
3. Verify configuration files
4. Check system resources

**Database:**
1. Check DATABASE_SCHEMA.md
2. Review migration files
3. Test queries in Tinker
4. Check database logs

---

## Project Structure

```
VisitorVault/
├── backend/                    # Laravel API
├── frontend/                   # React frontend
├── visitapis/                  # Bruno API collection
├── PROJECT_OVERVIEW.md         # Project overview
├── REQUIREMENTS.md             # Technical requirements
├── DEVELOPER_GUIDE.md          # Developer documentation
├── API_DOCUMENTATION.md        # API reference
├── DATABASE_SCHEMA.md          # Database documentation
├── DEPLOYMENT_GUIDE.md         # Deployment instructions
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guidelines
├── QUICK_REFERENCE.md          # Quick command reference
├── GLOSSARY.md                 # Terms and definitions
├── TROUBLESHOOTING.md          # Common issues and solutions
├── VISITS_MIGRATION_SUMMARY.md # Migration details
└── README.md                   # This file
```

---

## Version Information

- **Project Version**: 2.0
- **Documentation Last Updated**: December 2025
- **Laravel Version**: 12.x
- **React Version**: 18.x
- **Database Schema Version**: 2.0 (with visits table)
- **Documentation Files**: 12 comprehensive guides

---

## Contact & Support

**Developer:** BethLog Information Systems Limited  
**Website:** [desiderata.com](https://desiderata.com)

For technical support and inquiries, please refer to the appropriate documentation section above.

---

## License

MIT License - See individual project files for details.

---

**Happy coding! 🚀**

© BethLog Information Systems Limited
