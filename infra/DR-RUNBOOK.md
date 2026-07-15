# Disaster Recovery Runbook — Türkiye Pazaryeri

Last updated: Phase 6 hardening.

## Overview

| Component | RPO target | RTO target | Backup method |
|-----------|------------|------------|---------------|
| PostgreSQL | 1 hour | 4 hours | Continuous WAL + daily snapshot |
| Redis | 15 min | 1 hour | AOF persistence + hourly RDB |
| Object storage (S3) | 0 | 2 hours | Cross-region replication |
| OpenSearch | 24 hours | 4 hours | Daily snapshot to S3 |

## 1. PostgreSQL recovery

### Symptoms
- API `/v1/health/ready` returns `database: down`
- Worker outbox relay errors, Prisma connection failures

### Procedure
1. Confirm incident scope (single pod vs cluster-wide).
2. Stop API and worker deployments to prevent partial writes:
   ```bash
   kubectl scale deployment pazaryeri-api --replicas=0
   kubectl scale deployment pazaryeri-worker --replicas=0
   ```
3. Restore from latest snapshot + replay WAL to point-in-time.
4. Run migrations if restoring to empty volume:
   ```bash
   pnpm --filter @turkiye-pazaryeri/api prisma migrate deploy
   ```
5. Verify row counts for `User`, `Listing`, `Outbox` (undispatched count should be low).
6. Scale API/worker back up; monitor outbox relay draining backlog.

### Post-recovery
- Re-index OpenSearch (`listing.approved` events or full reindex job).
- Invalidate CDN media cache if storage was restored from older snapshot.

## 2. Redis recovery

### Symptoms
- Rate limiter failures, BullMQ jobs stalled, sessions invalidated

### Procedure
1. Fail over to Redis replica / restore from AOF.
2. Restart worker process — BullMQ will resume pending jobs.
3. Expect users to re-login (refresh token families may be lost if no backup).

## 3. Worker / queue backlog

### Symptoms
- Notifications delayed, images stuck in quarantine, KVKK jobs pending

### Procedure
1. Ensure worker pods are running: `pnpm --filter @turkiye-pazaryeri/api start:worker`
2. Check Redis queue depths for `notification`, `image-processing`, `kvkk`, `search-index`.
3. Outbox relay polls every 2s — verify `Outbox` table `dispatchedAt IS NULL` count trends down.
4. Manually re-dispatch if needed by resetting `dispatchedAt` for specific rows (super admin only).

## 4. OpenSearch recovery

### Procedure
1. Restore snapshot or recreate index (Turkish analyzer config in `SearchService.ensureIndex`).
2. Run full reindex from approved listings in PostgreSQL.
3. Public search falls back to Prisma browse until index is healthy.

## 5. Full region failover

1. DNS cutover to standby region (see `infra/nginx/default.conf` upstreams).
2. Restore Postgres + Redis from cross-region backups.
3. Verify feature flags and admin 2FA accounts in standby DB.
4. Smoke test:
   - `GET /v1/health/ready`
   - Register → login → browse listings
   - Admin login with 2FA → moderation queue

## 6. Contacts & escalation

| Role | Responsibility |
|------|----------------|
| On-call engineer | Initial triage, health checks, scaling |
| DBA | Postgres PITR restore |
| Security | KVKK breach assessment if user data affected |

## 7. Prevention checklist (monthly)

- [ ] Test Postgres restore to staging
- [ ] Verify backup retention meets KVKK requirements
- [ ] Run `pnpm test:integration` and `pnpm test:e2e` against staging
- [ ] Review `AdminAuditLog` for anomalous admin actions
- [ ] Confirm `OTEL_ENABLED` traces reaching observability backend
