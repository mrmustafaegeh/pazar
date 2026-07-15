# Türkiye Pazaryeri

Multi-vendor classifieds marketplace for the Turkish market — modeled on haraj.com.sa and sahibinden.com.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **API**: NestJS + Prisma + PostgreSQL 16
- **Frontends**: Next.js 15 (App Router) — `apps/web` (public) + `apps/admin` (dashboard)
- **Cache/Queue**: Redis 7 + BullMQ
- **Search**: OpenSearch with Turkish analyzer

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres, Redis, OpenSearch)

### Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure
docker compose -f infra/docker-compose.yml up -d

# Copy env files
cp apps/api/.env.example apps/api/.env

# Generate Prisma client
pnpm --filter @turkiye-pazaryeri/api prisma:generate

# Run all apps in dev mode
pnpm dev
```

### Ports

| Service    | Port |
|------------|------|
| Web        | 3000 |
| Admin      | 3001 |
| API        | 4000 |
| PostgreSQL | 5432 |
| Redis      | 6379 |
| OpenSearch | 9200 |

## Build Phases

See `.cursor/rules/project.md` for the full build brief. Work through phases in order:

- **Phase 0** — Scaffold ✅
- **Phase 1** — Data model & auth ✅
- **Phase 2** — Core listing lifecycle ✅
- **Phase 3** — Public site ✅
- **Phase 4** — Admin dashboard ✅
- **Phase 5** — Complaints, notifications, KVKK ✅
- **Phase 6** — Hardening & launch readiness ✅
- **Phase 7** — Monetization (when instructed)

## Scripts

```bash
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm typecheck      # Type-check all packages
pnpm test           # Unit tests
pnpm test:integration  # Integration tests (Testcontainers)
pnpm test:e2e       # E2E tests
```
