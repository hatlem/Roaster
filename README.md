# Roster SaaS - Norwegian Labor Law Compliant

A production-ready scheduling and roster management system built specifically for Norwegian businesses, fully compliant with Arbeidsmiljøloven (Working Environment Act).

## Features

### Legal Compliance (Arbeidsmiljøloven)
- **14-Day Rule (§ 10-2)**: Automated tracking ensures rosters are published 14 days before they start
- **Rest Period Validation (§ 10-8)**: Enforces 11-hour daily rest and 35-hour weekly rest requirements
- **Working Hour Limits (§ 10-4)**: Built-in caps for daily (9h), weekly (40h), and overtime hours
- **Overtime Tracking (§ 10-6)**: Monitors 10h/week, 25h/4weeks, 200h/year limits
- **Audit-Ready**: One-click export for Arbeidstilsynet inspections with 2+ years of data retention

### Employee Rights & Accessibility
- RESTful API for mobile and web access to schedules 24/7
- Draft mode with employee representative (tillitsvalgt) approval workflow
- Automatic change notifications and comprehensive logging
- GDPR-compliant data handling with role-based access control (RBAC)
- Employee preference management for scheduling

### Smart Scheduling
- Constraint-based validation engine (legal rules as hard constraints)
- Real-time compliance warnings during shift creation
- Automatic conflict detection
- Detailed violation reporting

## Quick Start

### With Docker (Recommended)

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Install dependencies
npm install

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### Manual Setup

See [Setup Guide](docs/SETUP.md) for detailed instructions.

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Installation and configuration
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Compliance Guide](docs/COMPLIANCE.md)** - Norwegian labor law implementation details

## Project Structure

```
Roaster/
├── prisma/
│   └── schema.prisma          # Database schema with compliance models
├── src/
│   ├── config/
│   │   └── compliance.ts      # Norwegian labor law configuration
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication & RBAC
│   ├── routes/
│   │   ├── auth.routes.ts    # Authentication endpoints
│   │   ├── roster.routes.ts  # Roster management endpoints
│   │   └── employee.routes.ts # Employee portal endpoints
│   ├── services/
│   │   ├── restPeriodValidator.ts        # 11/35 hour rest validation
│   │   ├── workingHoursValidator.ts      # Daily/weekly hours validation
│   │   ├── publishValidator.ts           # 14-day rule enforcement
│   │   ├── auditLogger.ts                # Compliance audit logging
│   │   ├── complianceReportGenerator.ts  # Arbeidstilsynet reports
│   │   ├── rosterService.ts              # Main roster orchestration
│   │   └── notificationService.ts        # Employee notifications
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── index.ts              # Express server entry point
├── docs/                      # Documentation
├── docker-compose.yml         # Docker services
└── package.json
```

## Tech Stack

- **Backend**: Node.js 20+ with TypeScript 5
- **Framework**: Express.js with security middleware (helmet, cors)
- **Database**: PostgreSQL 16+ (ACID-compliant for audit trails)
- **ORM**: Prisma (type-safe database access)
- **Validation**: Zod (runtime type validation)
- **Authentication**: JWT with bcrypt password hashing
- **Logging**: Winston (structured logging)
- **Deployment**: Docker & Docker Compose ready

## API Overview

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Current user info

### Roster Management (Manager/Admin)
- `POST /api/rosters` - Create roster
- `GET /api/rosters/:id` - Get roster with compliance summary
- `POST /api/rosters/:id/shifts` - Add shift (with validation)
- `POST /api/rosters/:id/publish` - Publish roster (14-day check)
- `POST /api/rosters/:id/review` - Send for representative review
- `POST /api/rosters/:id/approve` - Approve roster (representative)
- `PATCH /api/rosters/shifts/:id` - Modify published shift (with reason)

### Compliance Reports
- `GET /api/rosters/organization/:id/compliance-report` - Generate report
- `GET /api/rosters/organization/:id/compliance-report/export` - Export CSV/JSON

### Employee Portal
- `GET /api/employee/shifts` - View own shifts
- `GET /api/employee/rosters` - View published rosters
- `GET /api/employee/preferences` - Get scheduling preferences
- `POST /api/employee/preferences` - Update preferences
- `GET /api/employee/notifications` - Get notifications
- `GET /api/employee/hours-summary` - Hours worked summary

See [API Documentation](docs/API.md) for complete details.

## Compliance Highlights

**Built for the Arbeidstilsynet, so you don't have to be.**

### Automatic Enforcement
- **The 14-day rule, automated** - System prevents late publications and logs violations
- **Guardrails for your business** - Won't let you schedule illegal shifts (flags violations)
- **One-click audit reports** - Be inspection-ready in seconds, not days

### Comprehensive Audit Trail
Every action is logged for 2+ years:
- Who created/modified rosters and shifts
- When they were published (on time or late)
- All compliance violations
- Shift changes with reasons
- Employee access to schedules

### Real-Time Validation
When creating a shift, the system immediately checks:
- ✓ 11-hour rest before and after shift
- ✓ 35-hour rest in rolling 7-day windows
- ✓ Daily working hour limits (9h)
- ✓ Weekly working hour limits (40h)
- ✓ Overtime caps (10h/25h/200h)

Violations are flagged but don't block creation (manager may have valid exceptions).

## Development

```bash
# Run development server with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Database management
npm run db:generate    # Generate Prisma Client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio (GUI)

# Run tests (when implemented)
npm test
```

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/roster_saas
JWT_SECRET=your-strong-secret-key

# Optional (with defaults)
PORT=3000
NODE_ENV=development
ROSTER_PUBLISH_DEADLINE_DAYS=14
MIN_DAILY_REST_HOURS=11
MIN_WEEKLY_REST_HOURS=35
MAX_DAILY_WORK_HOURS=9
MAX_WEEKLY_WORK_HOURS=40
AUDIT_RETENTION_YEARS=2
```

## Production Deployment

```bash
# Build and run with Docker
docker-compose up -d

# Or manually
npm run build
npm run db:migrate
npm start
```

See [Setup Guide](docs/SETUP.md) for production deployment details.

## Contributing

Contributions are welcome! Please ensure:
- TypeScript strict mode compliance
- All validation logic includes tests
- Compliance features are well-documented
- API changes include documentation updates

## Legal Disclaimer

This software provides tools to help maintain compliance with Norwegian labor laws but does not guarantee legal compliance. Users are responsible for:
- Proper configuration for their industry/agreements
- Handling exceptions appropriately
- Consulting legal counsel when needed
- Maintaining accurate records

The employer remains legally responsible for compliance with Arbeidsmiljøloven.

## License

MIT License - See LICENSE file for details

## Support

- **Documentation**: See `docs/` directory
- **Issues**: Open an issue on GitHub
- **Compliance Questions**: Consult Norwegian Labour Inspection Authority (Arbeidstilsynet)

---

**Ad-Ready Taglines:**
- "Built for the Arbeidstilsynet, so you don't have to be"
- "The 14-day rule, automated. Never miss a compliance deadline again"
- "Guardrails for your business: Our AI won't let you schedule an illegal shift"
- "One-click audit reports. Be ready for inspection in seconds, not days"
