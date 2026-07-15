# Security Checklist — Türkiye Pazaryeri

Phase 6 review. Re-audit before production launch and quarterly thereafter.

## Authentication & sessions

| Control | Status | Notes |
|---------|--------|-------|
| Argon2id password hashing | ✅ | `PasswordService` |
| JWT access 15 min TTL | ✅ | Configurable via env |
| Rotating refresh tokens (httpOnly) | ✅ | Reuse detection in `TokenService` |
| 2FA for admin roles | ✅ | TOTP required for MODERATOR/SUPPORT/FINANCE/SUPER_ADMIN |
| Phone verification before posting | ✅ | `PhoneVerifiedGuard` on listings |
| Global JWT guard + `@Public()` opt-out | ✅ | `JwtAuthGuard` |

## Authorization

| Control | Status | Notes |
|---------|--------|-------|
| Server-side RBAC (`@Roles()`) | ✅ | All admin/moderation/ticket mutations |
| Append-only audit logs | ✅ | `AdminAuditLog`, `ModerationAction` |
| Separate admin app (port 3001) | ✅ | Distinct trust boundary from public web |

## Transport & headers

| Control | Status | Notes |
|---------|--------|-------|
| Helmet security headers | ✅ | `main.ts` |
| CORS allowlist | ✅ | `CORS_ORIGINS` env |
| CSRF on cookie-auth mutations | ✅ | `CsrfMiddleware` + double-submit |

## Rate limiting

| Control | Status | Notes |
|---------|--------|-------|
| Redis-backed throttler | ✅ | Global + auth-specific limits |
| OTP send cooldown | ✅ | 60s per phone in `OtpService` |

## Data protection (KVKK)

| Control | Status | Notes |
|---------|--------|-------|
| Data export API | ✅ | `/v1/kvkk/data-export` |
| Deletion request + admin approval | ✅ | Erasure job via KVKK queue |
| Soft delete on user-facing tables | ✅ | `deletedAt` pattern |
| Notification dispatch audit | ✅ | `NotificationLog` table |

## File uploads

| Control | Status | Notes |
|---------|--------|-------|
| Magic-byte validation | ✅ | `file-type` v16 |
| Quarantine → process → publish pipeline | ✅ | BullMQ `image-processing` |
| 10 MB size limit | ✅ | Multer config |

## Observability

| Control | Status | Notes |
|---------|--------|-------|
| Structured request logging | ✅ | `LoggingInterceptor` + pino |
| Request ID / trace correlation | ✅ | `traceparent` header support |
| OpenTelemetry (optional) | ✅ | `OTEL_ENABLED=true` |
| Health + readiness probes | ✅ | `/v1/health`, `/v1/health/ready` |

## Pre-launch actions

- [ ] Rotate all secrets in `.env.example` placeholders
- [ ] Enable `OTEL_ENABLED` and wire OTLP endpoint
- [ ] Configure WAF / DDoS protection at nginx/CDN layer
- [ ] Penetration test on auth + file upload flows
- [ ] Review `pnpm audit` high/critical findings
- [ ] Enable Socket.IO Redis adapter for multi-pod messaging
- [ ] Wire production SMS/email providers (replace dev log dispatch)

## Known gaps (post-Phase 6)

- Socket.IO Redis adapter not yet wired (single-pod real-time only)
- Production email/SMS providers stubbed (logs in dev, dispatches logged in `NotificationLog`)
- Monetization / payments dormant behind feature flag
