# MYLANKA — Миланка | Handmade Ukrainian Souvenirs

Online store for an existing offline souvenir shop selling handmade Ukrainian crafts: vyshyvanky, ceramics, woodwork, jewelry, charms (oberehy), and regional gifts. Primary audience: tourists (international + Ukrainian).

**Tagline UA:** Вишиванки ◆ Сувеніри ◆ Обереги
**Tagline EN:** Embroidery ◆ Souvenirs ◆ Charms
**Sub-tagline:** Традиції, що живуть у серці / Traditions that live in the heart

## Stack

- **Frontend:** Next.js 14+ (App Router, RSC), Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase), Prisma ORM
- **Auth:** NextAuth.js (admin), Telegram WebApp (customers)
- **Payments:** LiqPay + Monobank Acquiring
- **Storage:** Cloudflare R2 (product images)
- **Telegram:** grammY bot + Vite Mini App
- **Search:** Meilisearch (or Postgres FTS for MVP)
- **Deploy:** Vercel (web) + Railway (bot)

## Project Structure

```
mylanka/
├── prisma/              # DB schema + migrations + seed
├── src/
│   ├── app/
│   │   ├── [locale]/    # Public store (uk/en)
│   │   ├── admin/       # Admin panel
│   │   └── api/         # API routes + webhooks
│   ├── components/      # React components (ui/, layout/, products/, cart/, checkout/, ornaments/, admin/)
│   ├── lib/             # Utilities (prisma, auth, payments, novaposhta, feeds)
│   ├── hooks/           # Custom hooks
│   ├── messages/        # i18n (uk.json, en.json)
│   └── styles/          # globals.css
├── telegram-bot/        # grammY bot (separate entry)
├── telegram-miniapp/    # Vite + React Mini App
├── tests/               # unit / integration / e2e
└── public/              # Static assets (logos, og-image)
```

## Core Rules

1. **TypeScript strict mode.** All API responses typed. No `any`.
2. **Prices in kopecks.** 1 UAH = 100 kopecks. Store as `Int`. Format only at UI layer.
3. **Bilingual content.** All user-facing text: `nameUk` / `nameEn` pattern in DB, `next-intl` for UI strings.
4. **Mobile-first.** Tailwind responsive classes. Majority of traffic is mobile.
5. **Single inventory.** All channels (web, Telegram, Instagram, Prom.ua) read from same `Product.stock`.
6. **Error format.** API errors: `{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "..." } }`
7. **Git.** Conventional commits. One feature per branch.
8. **Images.** Next.js `<Image>` with responsive sizes: 200px (thumb), 400px (card), 800px (detail), 1200px (full).
9. **Order numbers.** Format: `MLN-YYYYMMDD-NNN` (e.g., `MLN-20260506-001`).
10. **No hardcoded strings.** All UI text goes through i18n. All config goes through env vars.

## Phases

Work through phases sequentially. See `docs/` for detailed specs:

| Phase | File | Scope |
|-------|------|-------|
| 0 | `docs/DESIGN-SYSTEM.md` | Brand colors, fonts, UI components, ornaments |
| 1 | `docs/ARCHITECTURE.md` | DB schema, project setup, seed data |
| 2 | `docs/PHASE-1-STORE.md` | Catalog, cart, checkout, i18n, SEO |
| 3 | `docs/PHASE-2-PAYMENTS.md` | LiqPay, Monobank, webhooks |
| 4 | `docs/PHASE-3-ADMIN.md` | Admin panel, dashboard, CRUD |
| 5 | `docs/PHASE-4-TELEGRAM.md` | Bot + Mini App |
| 6 | `docs/PHASE-5-FEEDS.md` | Instagram, Prom.ua product feeds |
| 7 | `docs/PHASE-6-DEPLOY.md` | Testing, CI/CD, deployment |

## Environment

See `docs/PHASE-6-DEPLOY.md` for full `.env` template. Key vars:
```
DATABASE_URL, LIQPAY_PUBLIC_KEY, LIQPAY_PRIVATE_KEY, MONOBANK_TOKEN,
TELEGRAM_BOT_TOKEN, NOVAPOSHTA_API_KEY, NEXTAUTH_SECRET
```
