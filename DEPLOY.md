# Mylanka — Deploy Guide

End-to-end production deployment for the three services:

| Service | Platform | Code path |
|---|---|---|
| Web store + admin + API | Vercel | repo root (Next.js) |
| Telegram Mini App (static) | Vercel | `telegram-miniapp/` |
| Telegram bot (long-running process) | Railway | `src/bot/` |
| Database | Supabase | (already provisioned) |
| Object storage | Cloudflare R2 | (already provisioned) |

DNS terminus: `mylanka.com.ua` (apex + `tg.` + `cdn.` subdomains).

---

## 1. Prerequisites

Accounts you should have ready:

- [x] **GitHub** — repo already pushed (`webitnet/mylanka`).
- [ ] **Vercel** — sign in with GitHub.
- [ ] **Railway** — sign in with GitHub. Free hobby tier ($5/mo credit) is enough for the bot.
- [ ] **Cloudflare** — DNS for `mylanka.com.ua` should be on Cloudflare (recommended) or another DNS host.

Local sanity check before deploying:

```bash
npm run type-check
npm run lint
(cd telegram-miniapp && npm run build)
```

CI runs all three on every PR — see `.github/workflows/ci.yml`.

---

## 2. Deploy the Next.js app (Vercel)

1. Vercel → **New Project** → import the GitHub repo `webitnet/mylanka`.
2. **Framework Preset**: Next.js (auto-detected). **Root Directory**: leave as `./`.
3. **Build & Output**: defaults are fine (`npm run build`, output handled by Next).
4. **Environment Variables** — paste everything from `.env.example`, with real
   production values. Critical:
   - `DATABASE_URL` & `DIRECT_URL` — Supabase pooled + direct
   - `NEXTAUTH_URL=https://mylanka.com.ua`
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `PUBLIC_BASE_URL=https://mylanka.com.ua`
   - `MONOBANK_TOKEN` — **production** acquiring token (not sandbox)
   - `LIQPAY_PUBLIC_KEY` / `LIQPAY_PRIVATE_KEY` — production once regional
     block resolved; meanwhile keep `NEXT_PUBLIC_LIQPAY_ENABLED="false"`
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_BOT_USERNAME`
   - `NOVAPOSHTA_API_KEY`
   - `R2_*` (account id, access key, secret, bucket, public URL)
5. **Deploy**. First build will take ~3 min.
6. Add the custom domain `mylanka.com.ua` (and the `www.` redirect).
   Update DNS records as Vercel instructs (A/AAAA or CNAME).
7. After SSL is green, hit `https://mylanka.com.ua/api/health` — should return
   `{ "status": "ok" }`.

---

## 3. Deploy the Mini App (Vercel)

Separate Vercel project, same repo.

1. Vercel → **New Project** → same repo, but set **Root Directory** =
   `telegram-miniapp`.
2. Framework Preset: **Other**. `vercel.json` already specifies build
   command, output dir, and the `/api/*` → `https://mylanka.com.ua` rewrite
   (so the Mini App and backend share one origin and don't need CORS).
3. Deploy. No env vars required for the build itself.
4. Add the custom domain `tg.mylanka.com.ua`.
5. Smoke test: `https://tg.mylanka.com.ua` should load the catalog grid.

### Register Mini App with @BotFather

1. Open `@BotFather` in Telegram → `/mybots` → `mylanka_shop_bot`.
2. **Bot Settings** → **Menu Button** → set URL to `https://tg.mylanka.com.ua`,
   label `Магазин`.
3. **Configure Mini App** → set the same URL (this enables the "Launch" button
   in the bot profile too).
4. `/setinline` → on → placeholder `Шукати вишиванки, обереги…`. This enables
   the bot's inline-query product search.

---

## 4. Deploy the bot (Railway)

The bot uses long polling, so it needs an always-on process. Vercel Functions
can't host this — use Railway.

1. Railway → **New Project** → **Deploy from GitHub repo** → pick `mylanka`.
2. Service name: `mylanka-bot`.
3. **Settings → Build**:
   - Build command: `npm ci && npx prisma generate`
   - Start command: `npm run bot:start`
4. **Variables** — add the same env block from `.env.example`. The bot only
   *needs* a subset: `DATABASE_URL`, `DIRECT_URL`, `TELEGRAM_BOT_TOKEN`,
   `TELEGRAM_ADMIN_CHAT_ID`, `PUBLIC_BASE_URL=https://mylanka.com.ua`,
   `TELEGRAM_LINK_BASE_URL=https://mylanka.com.ua`. Adding the rest is safe.
5. Deploy. Logs should show:
   ```
   [bot] starting (polling)…
   [bot] @mylanka_shop_bot ready
   ```
6. Verify in Telegram: `/start` to the bot in DM.

---

## 5. DNS summary

| Host | Type | Target | Notes |
|---|---|---|---|
| `mylanka.com.ua` | A/CNAME | Vercel | Main store + admin + API |
| `www.mylanka.com.ua` | CNAME | Vercel | Redirect → apex |
| `tg.mylanka.com.ua` | CNAME | Vercel | Mini App |
| `cdn.mylanka.com.ua` | CNAME | R2 custom domain | Optional — pretty image URLs |

(R2 → Cloudflare dashboard → bucket → **Settings** → **Custom Domain** → add
`cdn.mylanka.com.ua` → set `R2_PUBLIC_URL=https://cdn.mylanka.com.ua` in Vercel
env once active.)

---

## 6. Post-deploy checklist

- [ ] `https://mylanka.com.ua/api/health` → 200
- [ ] `https://mylanka.com.ua/sitemap.xml` returns all products
- [ ] `https://mylanka.com.ua/robots.txt` correct
- [ ] Admin login works at `/admin/login`
- [ ] Place a test order with COD → admin receives Telegram notification
- [ ] Place a test order with Monobank → redirect → real payment (1 UAH) →
      webhook fires → order goes to `PAID` → customer receives Telegram message
- [ ] Mini App `https://tg.mylanka.com.ua` loads catalog
- [ ] Bot `/start`, `/catalog`, `/orders`, `/help` all respond
- [ ] Bot inline mode: type `@mylanka_shop_bot вишиванка` in any chat
- [ ] R2 image upload from `/admin/products/new` succeeds (CORS configured)
- [ ] BetterStack / UptimeRobot configured for `/api/health` (every 5 min)

---

## 7. Rollback

Each Vercel deploy is immutable; promote a previous deployment from the
dashboard if a release breaks. Railway has the same model for the bot.

The DB is the only stateful piece — `pg_dump` from Supabase before any risky
migration, or rely on Supabase's automatic point-in-time recovery (paid tier).
