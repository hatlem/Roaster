# Production Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] Change all default passwords and secrets
- [ ] Generate strong JWT_SECRET (minimum 32 characters)
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable database encryption at rest
- [ ] Set up backup encryption
- [ ] Review and restrict CORS_ORIGIN
- [ ] Enable rate limiting
- [ ] Set up security headers (helmet)

### Database
- [ ] Provision production PostgreSQL instance
- [ ] Set up database backups (daily minimum)
- [ ] Configure connection pooling
- [ ] Set up database monitoring
- [ ] Run database migrations
- [ ] Test database recovery procedure

### Monitoring
- [ ] Set up application monitoring (Prometheus/Grafana)
- [ ] Configure error tracking (Sentry/similar)
- [ ] Set up log aggregation
- [ ] Configure alerts for critical errors
- [ ] Set up uptime monitoring
- [ ] Configure resource usage alerts

### Infrastructure
- [ ] Provision production servers/containers
- [ ] Set up load balancer
- [ ] Configure auto-scaling rules
- [ ] Set up CDN (if needed)
- [ ] Configure backup strategy
- [ ] Set up disaster recovery plan

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public&pool_timeout=0&connection_limit=50

# Application
NODE_ENV=production
PORT=3000

# Security
JWT_SECRET=<generate-with: openssl rand -base64 32>
JWT_EXPIRES_IN=7d

# CORS (comma-separated for multiple origins)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Compliance (Norwegian Labor Law)
ROSTER_PUBLISH_DEADLINE_DAYS=14
MIN_DAILY_REST_HOURS=11
MIN_WEEKLY_REST_HOURS=35
MAX_DAILY_WORK_HOURS=9
MAX_WEEKLY_WORK_HOURS=40
AUDIT_RETENTION_YEARS=2

# Logging
LOG_LEVEL=info

# Optional: External Services
SENTRY_DSN=<your-sentry-dsn>
REDIS_URL=redis://localhost:6379
```

### Generate Secure Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment Methods

### Method 1: Docker (Recommended)

#### Using Docker Compose

```bash
# 1. Clone repository
git clone <repository-url>
cd Roaster

# 2. Create production environment file
cp .env.example .env.production
# Edit .env.production with production values

# 3. Build and start services
docker-compose -f docker-compose.production.yml up -d

# 4. Run database migrations
docker-compose exec app npm run db:migrate:deploy

# 5. (Optional) Seed initial data
docker-compose exec app npm run db:seed

# 6. Check logs
docker-compose logs -f app
```

#### Using Kubernetes

```bash
# 1. Create namespace
kubectl create namespace roster-saas

# 2. Create secrets
kubectl create secret generic roster-secrets \
  --from-literal=DATABASE_URL=<your-db-url> \
  --from-literal=JWT_SECRET=<your-jwt-secret> \
  -n roster-saas

# 3. Apply configurations
kubectl apply -f k8s/ -n roster-saas

# 4. Check deployment
kubectl get pods -n roster-saas
kubectl logs -f deployment/roster-saas -n roster-saas
```

### Method 2: Direct Deployment

```bash
# 1. Install dependencies
npm ci --only=production

# 2. Generate Prisma Client
npm run db:generate

# 3. Build application
npm run build

# 4. Run database migrations
npm run db:migrate:deploy

# 5. Start application
npm start
```

### Method 3: Platform as a Service (PaaS)

#### Heroku

```bash
# 1. Create Heroku app
heroku create roster-saas-production

# 2. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set CORS_ORIGIN=https://yourapp.herokuapp.com

# 4. Deploy
git push heroku main

# 5. Run migrations
heroku run npm run db:migrate:deploy
```

#### Render

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Build Command: `npm install && npm run db:generate && npm run build`
   - Start Command: `npm run db:migrate:deploy && npm start`
4. Add PostgreSQL database
5. Set environment variables
6. Deploy

## Database Setup

### PostgreSQL Configuration

#### Recommended Settings for Production

```sql
-- Connection pooling
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5MB
min_wal_size = 1GB
max_wal_size = 4GB

-- Enable logging
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000  -- Log slow queries (>1s)
```

#### Database Indexes

The Prisma schema includes indexes. After deployment, verify:

```sql
-- Check indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Running Migrations

```bash
# Production deployment (no interactive prompts)
npm run db:migrate:deploy

# If you need to create a new migration
npm run db:migrate

# Reset database (DANGER: only for development)
npx prisma migrate reset
```

### Database Backups

#### Automated Daily Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups"
DATABASE_URL="postgresql://user:password@host:5432/database"

pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/roster-backup-$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "roster-backup-*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/roster-backup-$DATE.sql.gz s3://your-backup-bucket/
```

Add to crontab:
```
0 2 * * * /path/to/backup.sh
```

#### Restore from Backup

```bash
# Decompress
gunzip roster-backup-2024-01-31.sql.gz

# Restore
psql $DATABASE_URL < roster-backup-2024-01-31.sql
```

## Monitoring & Observability

### Health Checks

- **Basic health**: `GET /health`
- **Detailed health**: `GET /health/detailed`
- **Readiness probe**: `GET /ready`
- **Liveness probe**: `GET /live`

### Prometheus Metrics

Available at `/metrics`:

```
# HTTP metrics
http_requests_total
http_request_duration_seconds
http_active_connections

# Application metrics
roster_compliance_violations_total
rosters_published_total
shifts_created_total
```

### Setting up Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'roster-saas'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Setting up Grafana Dashboard

1. Add Prometheus data source
2. Import dashboard JSON (see `monitoring/grafana-dashboard.json`)
3. Configure alerts:
   - High error rate (>5%)
   - Slow response time (>2s)
   - Database connection issues
   - Compliance violations spike

### Log Aggregation

#### Using ELK Stack

```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/roster-saas/*.log
    json.keys_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

#### Using CloudWatch Logs (AWS)

```javascript
// Add winston-cloudwatch transport
import CloudWatchTransport from 'winston-cloudwatch';

logger.add(new CloudWatchTransport({
  logGroupName: 'roster-saas',
  logStreamName: 'production',
  awsRegion: 'eu-west-1',
}));
```

## Performance Optimization

### Database Connection Pooling

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  connection_limit = 50
  pool_timeout = 10
}
```

### Caching Strategy

#### Redis Caching (Optional)

```bash
npm install ioredis
```

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache roster data
await redis.setex(`roster:${id}`, 300, JSON.stringify(roster));

// Retrieve
const cached = await redis.get(`roster:${id}`);
```

### Load Balancing

#### Nginx Configuration

```nginx
upstream roster_saas {
    least_conn;
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 443 ssl http2;
    server_name roster-saas.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://roster_saas;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Hardening

### SSL/TLS Setup

```bash
# Using Let's Encrypt
certbot --nginx -d roster-saas.example.com
```

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH (restrict to specific IPs if possible)
ufw enable
```

### Database Security

```sql
-- Create read-only user for reporting
CREATE USER reporting WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE roster_saas TO reporting;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting;

-- Revoke public access
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

## Scaling

### Horizontal Scaling

```yaml
# kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: roster-saas
spec:
  replicas: 3  # Scale to 3 instances
  selector:
    matchLabels:
      app: roster-saas
  template:
    metadata:
      labels:
        app: roster-saas
    spec:
      containers:
      - name: app
        image: roster-saas:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### Auto-Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: roster-saas-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: roster-saas
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Troubleshooting

### Common Issues

#### High Memory Usage

```bash
# Check memory
node --max-old-space-size=2048 dist/index.js

# Monitor
docker stats roster-app
```

#### Slow Queries

```sql
-- Enable slow query logging
ALTER DATABASE roster_saas SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Connection Pool Exhausted

```typescript
// Increase pool size
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=100"
```

### Emergency Procedures

#### Rollback Deployment

```bash
# Kubernetes
kubectl rollout undo deployment/roster-saas

# Docker
docker-compose down
docker-compose up -d <previous-version>

# Heroku
heroku releases:rollback
```

#### Database Recovery

```bash
# Stop application
systemctl stop roster-saas

# Restore from backup
psql $DATABASE_URL < backup.sql

# Run migrations
npm run db:migrate:deploy

# Restart application
systemctl start roster-saas
```

## Support & Maintenance

### Regular Maintenance Tasks

- [ ] Weekly: Review error logs
- [ ] Weekly: Check disk usage
- [ ] Monthly: Review compliance reports
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Quarterly: Performance review
- [ ] Yearly: Disaster recovery drill

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update (test thoroughly!)
npm update

# Or update interactively
npx npm-check -u
```

## Compliance & Legal

### Arbeidstilsynet Preparedness

1. **Audit Logs**: Automatically retained for 2+ years
2. **Reports**: Available via `/api/rosters/organization/:id/compliance-report`
3. **Export**: CSV/JSON format for easy submission
4. **Backup**: Ensure backups include all audit data

### GDPR Compliance

- Data retention policies configured
- Personal data anonymization on request
- Access logs maintained
- Right to data export implemented

## Support

For production issues:
- Check logs: `docker-compose logs -f`
- Review metrics: `https://your-domain.com/metrics`
- Check health: `https://your-domain.com/health/detailed`
- Contact: [Your support email]
