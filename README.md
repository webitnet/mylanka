# Миланка (Mylanka)

Handmade Ukrainian souvenirs — online store.
**Вишиванки ◆ Сувеніри ◆ Обереги**

For project context, brand rules, phase plan and core conventions see [CLAUDE.md](./CLAUDE.md).
For design tokens (palette, typography, ornaments) see [docs/DESIGN-SYSTEM.md](./docs/DESIGN-SYSTEM.md).

## Stack

Next.js 14+ · TypeScript · Tailwind 4 · Prisma · PostgreSQL (Supabase) · NextAuth · next-intl (uk/en) · zustand cart · Nova Poshta API · LiqPay/Monobank (planned).

## Getting started

```bash
npm install
npx prisma generate
npx prisma migrate dev   # apply migrations to your Supabase / Postgres
npm run db:seed          # categories, products, admin user
npm run dev              # http://localhost:3000
```

Required env (see `.env.example`): `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NOVAPOSHTA_API_KEY`. Local secrets live in `.env` / `.env.local` (both gitignored).

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Seed categories, products, admin |
| `npm run db:studio` | Prisma Studio |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e |

## Project layout

See [CLAUDE.md](./CLAUDE.md) for the canonical structure. Phases are scoped in `docs/PHASE-*.md`.
