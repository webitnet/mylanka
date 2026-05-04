# Phase 6 — Testing & Deployment

Estimated: 1 week

## Testing

### Unit Tests (Vitest)

```bash
npm install -D vitest
```

Test:
- Price calculation (kopecks math, formatting, currency display)
- Cart logic (add, remove, update quantity, merge anonymous → customer)
- Order number generation (`RDN-YYYYMMDD-NNN`)
- Payment signature validation (LiqPay SHA1, Monobank X-Sign)
- i18n string resolution
- Feed generation (Meta CSV, Prom YML — output format correctness)
- Telegram initData validation

### Integration Tests

- API route handlers: products CRUD, cart operations, checkout flow, webhooks
- Database operations with test database (Prisma with separate `DATABASE_URL`)
- Auth middleware (admin routes reject unauthorized)
- Nova Poshta API client (mock external calls)

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
```

Scenarios:
- Full purchase: browse → filter → add to cart → checkout → (mock) payment → confirmation
- Product search and filtering
- Cart persistence across page reloads
- Bilingual content switching (UK ↔ EN)
- Mobile responsive layout
- Admin: login → create product → edit → view in catalog

### Payment Testing

- **LiqPay sandbox:** use `sandbox_` prefixed keys, test card `4242424242424242`
- **Monobank:** test merchant account from Monobank business portal

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│                    Vercel                          │
│  ┌──────────────────────────────────────────────┐ │
│  │  Next.js App (Store + Admin + API)           │ │
│  │  SSR/SSG product pages, API routes           │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  Telegram Mini App (Vite static)             │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
          │                        │
          ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│   Supabase       │     │   Railway        │
│  PostgreSQL      │     │  Telegram Bot    │
│  File Storage    │     │  grammY          │
│  Realtime        │     │  Webhook mode    │
└──────────────────┘     └──────────────────┘
          │
          ▼
┌──────────────────┐
│   Meilisearch    │
│  Cloud or VPS    │
└──────────────────┘
```

## Domain & DNS

```
ridne.ua            → Vercel (main store)
admin.ridne.ua      → Vercel (same app, /admin routes)
tg.ridne.ua         → Vercel (Telegram Mini App, static)
cdn.ridne.ua        → Cloudflare R2 / Supabase Storage
```

## CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint          # ESLint
      - run: npm run type-check    # tsc --noEmit
      - run: npm run test          # Vitest unit + integration

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Deploy to Vercel preview
      - Run Playwright E2E against preview URL

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production        # Manual approval gate
    steps:
      - Deploy to Vercel production
      - Run smoke tests
      - Notify admin via Telegram bot
```

## Monitoring

| Tool | Purpose | Tier |
|------|---------|------|
| Sentry | Error tracking | Free |
| BetterStack / UptimeRobot | Uptime monitoring | Free |
| Plausible | Analytics (privacy-friendly, no cookies) | €9/mo |
| Vercel Logs | Request logs | Included |
| Pino | Structured logging | Free |

## Environment Variables

```bash
# ── Database ──
DATABASE_URL="postgresql://user:pass@host:5432/ridne?sslmode=require"

# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ── Auth ──
NEXTAUTH_SECRET="random-32-char-secret"
NEXTAUTH_URL="https://ridne.ua"

# ── LiqPay ──
LIQPAY_PUBLIC_KEY="sandbox_xxx"
LIQPAY_PRIVATE_KEY="sandbox_yyy"

# ── Monobank ──
MONOBANK_TOKEN="uXXXXXXXXXXXX"

# ── Telegram ──
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_ADMIN_CHAT_ID="-1001234567890"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="RidneShopBot"

# ── Nova Poshta ──
NOVAPOSHTA_API_KEY="xxx"

# ── Meilisearch ──
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey"

# ── Storage ──
STORAGE_BUCKET_URL="https://cdn.ridne.ua"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="ridne-assets"

# ── Email ──
RESEND_API_KEY="re_xxx"
EMAIL_FROM="shop@ridne.ua"

# ── Analytics ──
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="ridne.ua"

# ── Sentry ──
SENTRY_DSN="https://xxx@sentry.io/yyy"

# ── App ──
NEXT_PUBLIC_APP_URL="https://ridne.ua"
NEXT_PUBLIC_DEFAULT_LOCALE="uk"
```

## Launch Checklist

- [ ] Database migrated and seeded with real products
- [ ] All product images uploaded to CDN
- [ ] LiqPay production keys configured
- [ ] Monobank production token configured
- [ ] Domain DNS configured and SSL verified
- [ ] Telegram bot webhook set to production URL
- [ ] Instagram Shop catalog submitted for review
- [ ] Prom.ua feed URL registered
- [ ] Sentry configured for error tracking
- [ ] Uptime monitoring enabled
- [ ] Analytics script added
- [ ] robots.txt and sitemap.xml generated
- [ ] Open Graph images generated
- [ ] Admin user created (super_admin)
- [ ] Backup strategy configured (Supabase auto-backups)
- [ ] Test purchase completed end-to-end on production
