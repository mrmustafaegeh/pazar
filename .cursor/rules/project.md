---
description: Türkiye Pazaryeri build brief — architecture, phases, and non-negotiable decisions
alwaysApply: true
---

# Türkiye Pazaryeri — Build Brief

Work through Build Phases in order. Each phase is its own set of commits/PRs.
Later phases assume earlier ones are done and tested.

## What we're building

Multi-vendor classifieds marketplace for Turkey (haraj.com.sa / sahibinden.com model).
Sellers post listings across categories; every listing goes through admin moderation.
Admin dashboard for approvals, user management, complaints/tickets, analytics, config.
Posting free at launch. Monetization fields + checkout exist from day one behind feature flags.

## Non-negotiable architecture

| Layer | Decision |
|-------|----------|
| Language | TypeScript everywhere |
| Backend | NestJS |
| Frontend | Next.js 15 App Router — `apps/web` + `apps/admin` (separate apps) |
| Database | PostgreSQL 16 + Prisma |
| Cache/sessions/rate-limit | Redis 7 |
| Search | OpenSearch + Turkish analyzer |
| Queue | BullMQ on Redis, separate worker process |
| Object storage | S3-compatible + CDN |
| Real-time | Socket.IO + Redis adapter |
| Monorepo | pnpm workspaces + Turborepo |
| Auth | JWT access (10–15 min) + rotating refresh in httpOnly cookies, reuse detection |

## Repository structure

See README.md. Scaffold layout in Section 3 of original brief is canonical.

## Data model (Phase 1)

- Soft delete (`deletedAt`) on all user-facing tables
- `Listing.attributes` Json + per-category `attributeSchema` on Category
- Monetization fields dormant: `pricingTier`, `paymentStatus`, `Payment` with `idempotencyKey`
- Append-only: `ModerationAction`, `AdminAuditLog`
- Refresh token rotation with family id + reuse detection
- Transactional `Outbox` table
- `FeatureFlag` table (not env vars)

## Security hard requirements

Argon2id, phone verification before posting, 2FA for admin roles, server-side RBAC,
separate admin trust boundary, CSRF on cookie-auth mutating routes, Redis-backed throttler,
file upload pipeline (magic bytes → sharp re-encode → quarantine → publish), Prisma only.

## Build phases

0. **Scaffold** — monorepo, docker-compose, CI skeleton ✅
1. **Data model & auth** — Prisma schema, auth module, guards, CSRF, throttler, tests
2. **Core listing lifecycle** — categories, listings, moderation, image pipeline, worker
3. **Public site** — SSR/ISR, SEO, search, post-listing wizard, messaging UI
4. **Admin dashboard** — moderation queue, users, complaints, analytics, feature flags
5. **Complaints & notifications** — tickets, KVKK jobs, notification dispatch
6. **Hardening** — full test suite, tracing, DR runbook, security review
7. **Monetization** — only when explicitly instructed

## Definition of done (per phase)

- Unit + integration test coverage, CI gates pass
- No TODO/stub in live code paths
- New endpoints in Swagger
- Every mutating endpoint has explicit `@Roles()` guard
- Schema migrations follow expand/contract when table has production data

If this brief conflicts with a direct session instruction, stop and flag the conflict.
