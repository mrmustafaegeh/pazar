# Development Guide — Türkiye Pazaryeri

This document is for **you as the developer**: how to run the stack, keep it fast, and what has been built so far. The public [README](../README.md) describes the product for visitors; this file is your operational handbook.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [First-time setup](#first-time-setup)
3. [Daily startup (every time you work)](#daily-startup-every-time-you-work)
4. [Environment variables](#environment-variables)
5. [Ports & URLs](#ports--urls)
6. [Useful commands](#useful-commands)
7. [Troubleshooting](#troubleshooting)
8. [Performance strategies](#performance-strategies)
9. [What has been built](#what-has-been-built)
10. [Architecture notes](#architecture-notes)

---

## Tech stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Monorepo** | pnpm workspaces + Turborepo | One repo, shared packages, parallel dev/build |
| **Language** | TypeScript (strict) | End-to-end type safety |
| **Public site** | Next.js 15 App Router, React 19 | SSR/ISR marketplace at `apps/web` |
| **Admin panel** | Next.js 15 App Router | Moderation & ops at `apps/admin` |
| **API** | NestJS 11 | REST API, auth, business logic |
| **Worker** | NestJS (separate entry) | BullMQ jobs: images, search index, notifications, KVKK |
| **Database** | PostgreSQL 16 + Prisma | Primary data store |
| **Cache / queues** | Redis 7 | Sessions, rate limits, BullMQ |
| **Search** | OpenSearch 2.x | Turkish-aware full-text search |
| **Real-time** | Socket.IO + Redis adapter | Buyer–seller messaging |
| **Storage** | S3-compatible (R2/MinIO in prod) | Listing images (quarantine → publish pipeline) |
| **i18n** | next-intl | Turkish (default), English, Arabic + RTL |
| **UI motion** | framer-motion | Hero, scroll reveals, auth animations |
| **Styling** | Tailwind CSS | Navy `#12294B`, amber `#E8A33D` design system |
| **Validation** | Zod (shared `@turkiye-pazaryeri/types`) | API + forms |
| **Testing** | Jest, Playwright, Testcontainers | Unit, integration, e2e |
| **CI** | GitHub Actions | Lint, typecheck, tests on push/PR |

### Shared packages

| Package | Path | Role |
|---------|------|------|
| `@turkiye-pazaryeri/types` | `packages/types` | Zod schemas, DTOs |
| `@turkiye-pazaryeri/config` | `packages/config` | ESLint, Prettier, TS configs |
| `@turkiye-pazaryeri/ui` | `packages/ui` | Shared UI primitives (minimal today) |

---

## First-time setup

Run once on a new machine or after cloning.

### 1. Prerequisites

- **Node.js 20+** (see `.nvmrc`)
- **pnpm 9+** (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** (Colima on macOS, Docker Desktop, or Linux Docker)
- **Git**

### 2. Clone & install

```bash
git clone https://github.com/mrmustafaegeh/pazar.git
cd pazar   # or turkiye-pazaryeri locally
pnpm install
```

### 3. Start infrastructure (Postgres, Redis, OpenSearch)

```bash
# macOS with Colima (if Docker isn't running):
colima start

docker compose -f infra/docker-compose.yml up -d
```

Wait until containers are healthy:

```bash
docker compose -f infra/docker-compose.yml ps
```

### 4. Environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

Edit `apps/api/.env` if needed. Defaults work for local Docker.

### 5. Database

```bash
pnpm --filter @turkiye-pazaryeri/api prisma:generate
pnpm --filter @turkiye-pazaryeri/api prisma:migrate
pnpm --filter @turkiye-pazaryeri/api prisma:seed
```

Seed creates categories, sample listings, feature flags, and a dev admin user.

### 6. Verify

Open http://localhost:3000 — homepage should show categories and listings (API must be running; see daily startup).

---

## Daily startup (every time you work)

You need **4 things** running: Docker infra, API, worker (optional but recommended), and web (and admin if needed).

### Terminal 1 — Infrastructure (if not already up)

```bash
colima start                    # only if Docker daemon is stopped
docker compose -f infra/docker-compose.yml up -d
```

### Terminal 2 — API

```bash
pnpm --filter @turkiye-pazaryeri/api dev
```

API listens on **http://localhost:4000** (Swagger at `/v1/docs` if enabled).

### Terminal 3 — Background worker (recommended)

Handles image processing, search indexing, notifications, outbox relay:

```bash
pnpm --filter @turkiye-pazaryeri/api dev:worker
```

### Terminal 4 — Public website

```bash
pnpm --filter @turkiye-pazaryeri/web dev
```

→ **http://localhost:3000**  
→ Arabic: **http://localhost:3000/ar**  
→ English: **http://localhost:3000/en**

### Terminal 5 — Admin panel (when moderating)

```bash
pnpm --filter @turkiye-pazaryeri/admin dev
```

→ **http://localhost:3001**

### Shortcut — all apps at once

```bash
pnpm dev
```

Runs web, admin, and API via Turborepo. **You still need Docker infra** and should run the **worker** in a separate terminal for full functionality.

### Quick health check

```bash
curl -s http://localhost:4000/v1/health | head
curl -s "http://localhost:4000/v1/listings?page=1&limit=1" | head -c 200
```

If these fail with `ECONNREFUSED`, the API is not running — listings will appear empty on the site.

---

## Environment variables

### `apps/api/.env` (required)

| Variable | Local default | Notes |
|----------|---------------|-------|
| `DATABASE_URL` | `postgresql://pazaryeri:pazaryeri@localhost:5432/pazaryeri` | Must match Docker Postgres |
| `REDIS_URL` | `redis://localhost:6379` | |
| `OPENSEARCH_URL` | `http://localhost:9200` | |
| `JWT_ACCESS_SECRET` | change in prod | Min 32 chars |
| `JWT_REFRESH_SECRET` | change in prod | Min 32 chars |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | |
| `CSRF_SECRET` | change in prod | |
| `S3_*` | empty in dev | Local uploads may use filesystem fallback |

### `apps/web/.env`

| Variable | Local default |
|----------|---------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

### `apps/admin/.env`

| Variable | Local default |
|----------|---------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |

**Never commit `.env` files** — only `.env.example`.

---

## Ports & URLs

| Service | Port | URL |
|---------|------|-----|
| Web (public) | 3000 | http://localhost:3000 |
| Admin | 3001 | http://localhost:3001 |
| API | 4000 | http://localhost:4000/v1 |
| PostgreSQL | 5432 | `localhost:5432` |
| Redis | 6379 | `localhost:6379` |
| OpenSearch | 9200 | http://localhost:9200 |

---

## Useful commands

```bash
# Install dependencies
pnpm install

# Run everything (turbo)
pnpm dev

# Build all apps
pnpm build

# Lint & typecheck
pnpm lint
pnpm typecheck

# Unit tests (API)
pnpm --filter @turkiye-pazaryeri/api test

# Integration tests (needs Docker)
pnpm test:integration

# E2E (Playwright)
pnpm --filter @turkiye-pazaryeri/web test:e2e

# Database
pnpm --filter @turkiye-pazaryeri/api prisma:studio   # GUI
pnpm --filter @turkiye-pazaryeri/api prisma:seed     # re-seed data

# Admin 2FA dev code (TOTP secret in seed)
pnpm --filter @turkiye-pazaryeri/api dev:2fa-code

# Stop infrastructure
docker compose -f infra/docker-compose.yml down
```

---

## Troubleshooting

### Homepage shows no listings / categories empty

**Cause:** Web is running but API is not (`ECONNREFUSED` in terminal).

**Fix:** Start API (`pnpm --filter api dev`) and ensure Docker Postgres is up.

### `docker: Cannot connect to Docker daemon`

**Fix (macOS):** `colima start` then retry `docker compose ... up -d`.

### OpenSearch container slow or OOM

OpenSearch wants ~512MB heap. Close other heavy apps or increase Colima memory:

```bash
colima stop && colima start --memory 6
```

### Next.js image 404 for Unsplash URLs

Category placeholders live in `apps/web/src/lib/categoryImages.ts`. If Unsplash removes a photo, update URLs there and restart dev server. Clear cache if needed:

```bash
rm -rf apps/web/.next
```

### Auth pages still show header/footer

Auth routes live under `apps/web/src/app/[locale]/(auth)/` with their own layout (no chrome). Hard-refresh or restart dev server after route changes.

### Migrations out of sync

```bash
pnpm --filter @turkiye-pazaryeri/api prisma:migrate
```

---

## Performance strategies

### Frontend (Next.js — `apps/web`)

| Strategy | Where | Why |
|----------|-------|-----|
| **ISR / revalidation** | Homepage `revalidate = 60`, listings/categories 30–120s | Cache rendered pages; reduce API load |
| **Streaming + Suspense** | Homepage featured listings, browse loading states | Faster TTFB; skeleton while data loads |
| **Server Components** | Most pages fetch via `apiServer` on the server | No client-side waterfall for initial data |
| **GPU-friendly motion** | framer-motion: `opacity` + `transform` only | Scroll reveals without layout thrash |
| **`prefers-reduced-motion`** | `Reveal`, `HeroSection`, auth forms | Accessibility + less work on low-power devices |
| **`whileInView` once** | Section scroll animations | No repeat work on scroll |
| **Image optimization** | `next/image` + remote patterns for API media & Unsplash | Automatic sizing, lazy load, WebP |
| **Hero search deferral** | Header search hidden until hero scrolls away | One search entry point; less clutter |
| **Parallel data fetching** | Server pages use `Promise.all` where possible | Shorter server render time |
| **Client bundle discipline** | `'use client'` only on interactive islands | Smaller JS payload |

**Tuning tips:**

- Increase `revalidate` on stable pages (categories) if content rarely changes.
- Keep listing detail `revalidate` lower (60s) for fresher prices.
- Use `loading.tsx` on slow routes (already on `/ara`, `/kategori/[slug]`).
- After large UI changes, delete `.next` once to avoid stale chunks.

### Backend (NestJS — `apps/api`)

| Strategy | Where | Why |
|----------|-------|-----|
| **Redis throttling** | Global + auth endpoints | Abuse protection without DB hits |
| **BullMQ worker** | Separate process from HTTP | Long jobs don't block API responses |
| **Outbox pattern** | `Outbox` table + relay processor | Reliable async side effects |
| **OpenSearch** | Listing search vs SQL `LIKE` | Fast full-text, Turkish analyzer |
| **Prisma** | Parameterized queries only | No raw SQL injection surface |
| **Image pipeline** | Quarantine → sharp re-encode → publish | Smaller files, safer uploads |
| **JWT short TTL** | 15 min access tokens | Limits stolen token window |
| **Connection pooling** | Prisma + Postgres | Reuse DB connections |

**Tuning tips:**

- Run **worker** whenever testing listing publish, images, or search.
- Monitor Redis memory if queue backs up.
- OpenSearch: reindex after bulk seed (`search-index` job).

### Infrastructure & production-minded habits

| Strategy | Notes |
|----------|-------|
| **Docker healthchecks** | Postgres/Redis/OpenSearch wait until ready |
| **Turborepo** | Cached builds; `dev` tasks marked persistent |
| **CI on every push** | Lint, typecheck, tests — catch regressions early |
| **Feature flags in DB** | `payments_enabled` etc. — toggle without redeploy |
| **CDN for media** | S3 public bucket + CDN in production |
| **Separate admin app** | Smaller attack surface on public site |

### Local dev performance

- Start only what you need: web + API + docker is enough for UI work.
- Skip OpenSearch if only testing auth (search will degrade gracefully or error — check logs).
- Use `pnpm --filter web dev` instead of full monorepo dev to save CPU.

---

## What has been built

### Core platform (Phases 0–6)

- **Monorepo** with web, admin, API, worker, shared types
- **Auth:** register, login, JWT + refresh cookies, 2FA (TOTP), phone OTP, CSRF
- **Listings:** create, edit, moderate, soft delete, category attribute schemas
- **Images:** upload, quarantine, processing worker, published URLs
- **Search:** OpenSearch indexing + browse/filter UI
- **Messaging:** Socket.IO conversations between buyers and sellers
- **Moderation:** admin queue, approve/reject, audit log
- **Tickets / support:** complaints, KVKK deletion requests
- **Payments:** checkout scaffolding behind `payments_enabled` flag
- **Admin dashboard:** users, listings, categories, analytics, feature flags
- **i18n:** TR / EN / AR with RTL for Arabic
- **Currency display:** TRY, USD, EUR (cookie-based preference)

### Public site UI (recent work)

- **Header:** simplified nav (Home, Categories dropdown, Support), single search bar, globe settings (language + currency), compact auth cluster, navy CTA
- **Scroll-aware header:** frosted over hero → solid white after 60px
- **Hero:** full-width with rounded bottom, parallax background, staggered entrance, stats panel, redesigned search bar
- **Scroll motion:** `Reveal` / `StaggerGrid` on homepage sections; count-up stats; CTA band animation
- **Auth pages:** full-screen layout (no header/footer), split panel with Istanbul photo + trust bullets, form icons, password strength, staggered fields
- **Category images:** centralized in `categoryImages.ts` with verified Unsplash fallbacks
- **Route groups:** `(main)` vs `(auth)` layouts for clean separation

### Design tokens

- Navy: `#12294B` (`navy` / `primary`)
- Amber: `#E8A33D` (`accent`)
- Tailwind + CSS variables in `apps/web/src/app/globals.css`

### DevOps & docs

- GitHub Actions CI
- Docker Compose for local infra
- K8s manifests + nginx config in `infra/`
- Security checklist & DR runbook

---

## Architecture notes

```
Browser
   │
   ├─► apps/web (Next.js :3000) ──► API :4000
   ├─► apps/admin (:3001) ────────► API :4000
   │
API (NestJS)
   ├─► PostgreSQL (Prisma)
   ├─► Redis (cache, throttle, Socket.IO adapter, BullMQ)
   ├─► OpenSearch (listings index)
   └─► S3 (images)

Worker (NestJS, separate process)
   └─► BullMQ jobs: images, search-index, notifications, kvkk, outbox-relay
```

### Auth routes (web)

| Path | Layout |
|------|--------|
| `/giris`, `/kayit`, `/giris/2fa` | `(auth)` — full screen |
| Everything else | `(main)` — header + footer |

### Key files to know

| Area | Path |
|------|------|
| Web homepage | `apps/web/src/app/[locale]/(main)/page.tsx` |
| Hero | `apps/web/src/components/HeroSection.tsx` |
| Header | `apps/web/src/components/Header.tsx` |
| Auth shell | `apps/web/src/components/auth/AuthShell.tsx` |
| API client | `apps/web/src/lib/api.ts` |
| Prisma schema | `apps/api/prisma/schema.prisma` |
| Seed data | `apps/api/prisma/seed.ts` |
| Build brief | `.cursor/rules/project.md` |

---

## Before production

- [ ] Rotate all secrets in `apps/api/.env`
- [ ] Configure real S3 + CDN
- [ ] Set `OTEL_ENABLED=true` and wire tracing
- [ ] Review `infra/SECURITY-CHECKLIST.md`
- [ ] Run full test suite + e2e
- [ ] Enable payments flag only when ready (`FeatureFlag` table)

---

*Last updated: July 2026 — keep this file in sync when you add major features or change startup steps.*
