# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying Roster SaaS to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- Ingress controller (nginx-ingress recommended)
- cert-manager (for automatic TLS certificates)

## Quick Start

```bash
# 1. Create namespace
kubectl apply -f namespace.yaml

# 2. Create secrets (replace placeholder values first!)
# Option A: Edit secrets.yaml and apply
kubectl apply -f secrets.yaml

# Option B: Create secrets from command line (recommended)
kubectl create secret generic roster-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@postgres-service:5432/roster_production?schema=public' \
  --from-literal=JWT_SECRET='your-32-char-secure-secret' \
  --from-literal=POSTGRES_PASSWORD='your-db-password' \
  -n roster-saas

# 3. Apply configuration
kubectl apply -f configmap.yaml

# 4. Deploy PostgreSQL
kubectl apply -f postgres.yaml

# 5. Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n roster-saas --timeout=120s

# 6. Deploy application
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# 7. Run database migrations
kubectl exec -it $(kubectl get pod -l app=roster-saas -n roster-saas -o jsonpath='{.items[0].metadata.name}') \
  -n roster-saas -- npm run db:migrate:deploy

# 8. Configure ingress (update hostname first!)
kubectl apply -f ingress.yaml

# 9. Enable auto-scaling
kubectl apply -f hpa.yaml
```

## Files

| File | Description |
|------|-------------|
| `namespace.yaml` | Kubernetes namespace |
| `secrets.yaml` | Secrets template (DO NOT commit real values!) |
| `configmap.yaml` | Non-sensitive configuration |
| `postgres.yaml` | PostgreSQL StatefulSet with PVC |
| `deployment.yaml` | Main application deployment |
| `service.yaml` | Service and metrics endpoint |
| `ingress.yaml` | Ingress with TLS |
| `hpa.yaml` | Horizontal Pod Autoscaler |

## Configuration

### Update Image Reference

Edit `deployment.yaml` and replace the image:
```yaml
image: ghcr.io/your-org/roster-saas:latest
```

### Update Ingress Hostname

Edit `ingress.yaml` and replace the hostname:
```yaml
- host: your-domain.com
```

### Update TLS Certificate

Ensure cert-manager is configured and update:
```yaml
cert-manager.io/cluster-issuer: your-issuer-name
```

## Monitoring

The application exposes Prometheus metrics at `/metrics`. Annotations are added to enable automatic scraping:

```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "3000"
prometheus.io/path: "/metrics"
```

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic health check |
| `/ready` | Kubernetes readiness probe |
| `/live` | Kubernetes liveness probe |
| `/health/detailed` | Detailed health with DB status |

## Scaling

The HPA automatically scales based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)

Manual scaling:
```bash
kubectl scale deployment roster-saas --replicas=5 -n roster-saas
```

## Troubleshooting

```bash
# View pod status
kubectl get pods -n roster-saas

# View logs
kubectl logs -f deployment/roster-saas -n roster-saas

# Describe deployment
kubectl describe deployment roster-saas -n roster-saas

# Check events
kubectl get events -n roster-saas --sort-by='.lastTimestamp'

# Access shell
kubectl exec -it deployment/roster-saas -n roster-saas -- /bin/sh
```

## Database Backup

```bash
# Create backup
kubectl exec -it $(kubectl get pod -l app=postgres -n roster-saas -o jsonpath='{.items[0].metadata.name}') \
  -n roster-saas -- pg_dump -U roster_user roster_production > backup.sql

# Restore backup
kubectl exec -i $(kubectl get pod -l app=postgres -n roster-saas -o jsonpath='{.items[0].metadata.name}') \
  -n roster-saas -- psql -U roster_user roster_production < backup.sql
```
