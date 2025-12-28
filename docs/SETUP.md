# Setup Guide

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 16+
- Docker and Docker Compose (optional, for easy setup)

## Quick Start with Docker

The easiest way to get started:

```bash
# 1. Clone the repository
git clone <repository-url>
cd Roaster

# 2. Start PostgreSQL with Docker Compose
docker-compose up -d postgres

# 3. Install dependencies
npm install

# 4. Initialize database
npm run db:push

# 5. Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

## Manual Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/roster_saas?schema=public"

# JWT secret (generate a strong random string)
JWT_SECRET="your-secret-key-here"

# Compliance settings (adjust if needed)
ROSTER_PUBLISH_DEADLINE_DAYS=14
MIN_DAILY_REST_HOURS=11
MIN_WEEKLY_REST_HOURS=35
MAX_DAILY_WORK_HOURS=9
MAX_WEEKLY_WORK_HOURS=40
AUDIT_RETENTION_YEARS=2
```

### 3. Set Up PostgreSQL

**Option A: Use Docker**
```bash
docker-compose up -d postgres
```

**Option B: Install Locally**

Install PostgreSQL and create database:

```sql
CREATE DATABASE roster_saas;
CREATE USER roster_user WITH PASSWORD 'roster_password';
GRANT ALL PRIVILEGES ON DATABASE roster_saas TO roster_user;
```

### 4. Initialize Database

Generate Prisma client and push schema to database:

```bash
npm run db:generate
npm run db:push
```

For production, use migrations instead:

```bash
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Production Deployment

### Using Docker

Build and run the full stack:

```bash
# Build the application
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables:
```bash
export NODE_ENV=production
export DATABASE_URL="your-production-db-url"
export JWT_SECRET="strong-random-secret"
```

3. Run migrations:
```bash
npm run db:migrate
```

4. Start the server:
```bash
npm start
```

### Environment Variables for Production

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=<strong-random-string-min-32-chars>
JWT_EXPIRES_IN=7d
PORT=3000
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
AUDIT_RETENTION_YEARS=2
```

## Creating the First Admin User

After setup, create an admin user via API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Then manually update their role in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Or use Prisma Studio:

```bash
npm run db:studio
```

Navigate to the User table and change the role to `ADMIN`.

## Creating an Organization

```bash
# Login to get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "SecurePassword123"}' \
  | jq -r '.token')

# Create organization (using database directly for now)
# In Prisma Studio or psql:
```

```sql
INSERT INTO "Organization" (id, name, "orgNumber", "contactEmail")
VALUES ('org-uuid-here', 'Example AS', '123456789', 'contact@example.com');
```

## Testing the API

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123"
  }'
```

Save the returned token.

### 2. Create a Roster

```bash
curl -X POST http://localhost:3000/api/rosters \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-uuid",
    "name": "February 2024 Schedule",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-29T23:59:59Z"
  }'
```

### 3. Add a Shift

```bash
curl -X POST http://localhost:3000/api/rosters/<roster-id>/shifts \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<employee-user-id>",
    "startTime": "2024-02-05T08:00:00Z",
    "endTime": "2024-02-05T16:00:00Z",
    "breakMinutes": 30,
    "department": "Operations"
  }'
```

### 4. Publish Roster

```bash
curl -X POST http://localhost:3000/api/rosters/<roster-id>/publish \
  -H "Authorization: Bearer <your-token>"
```

## Database Management

### View Database in Prisma Studio

```bash
npm run db:studio
```

Opens a web interface at `http://localhost:5555` to browse and edit data.

### Run Migrations

```bash
npm run db:migrate
```

### Reset Database (Development Only)

```bash
npx prisma db push --force-reset
```

**WARNING:** This deletes all data!

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-31T10:00:00.000Z",
  "service": "roster-saas",
  "version": "1.0.0"
}
```

### Logs

Logs are written to:
- Console (stdout)
- `logs/error.log` (errors only)
- `logs/combined.log` (all logs)

View logs:
```bash
tail -f logs/combined.log
```

## Troubleshooting

### Database Connection Issues

1. Check PostgreSQL is running:
```bash
docker-compose ps
# or
pg_isready
```

2. Verify DATABASE_URL in `.env`

3. Test connection:
```bash
psql $DATABASE_URL
```

### Prisma Issues

1. Regenerate Prisma Client:
```bash
npm run db:generate
```

2. Clear Prisma cache:
```bash
rm -rf node_modules/.prisma
npm run db:generate
```

### Port Already in Use

Change the port in `.env`:
```bash
PORT=3001
```

## Next Steps

- Read [API Documentation](./API.md) for endpoint details
- Read [Compliance Guide](./COMPLIANCE.md) to understand legal features
- Set up a frontend application to consume the API
- Configure backups for the PostgreSQL database
- Set up monitoring and alerting for production

## Support

For issues, questions, or contributions, please open an issue on GitHub.
