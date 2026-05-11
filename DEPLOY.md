# Mylanka — Deploy Guide

End-to-end production deployment for the three services:

| Service | Platform | Code path |
|---|---|---|
| Web store + admin + API | Vercel | repo root (Next.js) |
| Telegram Mini App (static) | Vercel | `telegram-miniapp/` |
| Telegram bot (long-running process) | VDS (thehost.com.ua) via pm2 | `src/bot/` |
| Database | Supabase | (already provisioned) |
| Object storage | Cloudflare R2 | (already provisioned) |

DNS terminus: `mylanka.com.ua` — managed via **thehost.com.ua** DNS panel
(apex + `tg.` + optional `cdn.` subdomains).

---

## 1. Prerequisites

Accounts you should have ready:

- [x] **GitHub** — repo already pushed (`webitnet/mylanka`, private).
- [x] **Vercel** — project imported from the GitHub repo.
- [x] **VDS (thehost.com.ua)** — already running other bots; bot will live here under pm2.
- [x] **DNS** — managed via thehost.com.ua DNS panel.

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

## 4. Deploy the bot (VDS via pm2)

The bot uses long polling — a plain Node.js process that needs to stay
running. On the VDS (thehost.com.ua) you already use pm2 for other bots;
we follow the same pattern.

### One-time setup on the VDS

```bash
# As the deploy user, in the home dir or /srv:
git clone git@github.com:webitnet/mylanka.git mylanka
cd mylanka

# Node 20+ required.
node --version

# Install deps and generate the Prisma client.
npm ci
npx prisma generate

# Create the runtime .env. Minimum required keys for the bot:
cat > .env <<'EOF'
DATABASE_URL="postgresql://...@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://...@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_ADMIN_CHAT_ID="-1003510345800"
PUBLIC_BASE_URL="https://mylanka.com.ua"
TELEGRAM_LINK_BASE_URL="https://mylanka.com.ua"
EOF
chmod 600 .env

# Start under pm2 (ecosystem.config.cjs is committed at repo root).
pm2 start ecosystem.config.cjs
pm2 logs mylanka-bot          # tail logs — should see "@mylanka_shop_bot ready"

# Persist across reboots:
pm2 save
pm2 startup                   # follow the printed command (sudo systemctl ...)
```

### Re-deploy after a code change

```bash
cd /path/to/mylanka
git pull
npm ci
npx prisma generate           # only if schema changed
pm2 reload mylanka-bot
```

The bot polls Telegram directly — no public ingress needed on the VDS,
no firewall rules to open. Only outbound HTTPS to api.telegram.org,
the Supabase pooler, and (for /orders / notifications) mylanka.com.ua.

### Cohabiting with other bots

`pm2 list` should show `mylanka-bot` alongside your existing processes,
each isolated by `cwd`. Logs are scoped per app (`pm2 logs mylanka-bot`).
Memory footprint of the bot is ~80 MB.

---

## 5. DNS — thehost.com.ua

Inside the thehost DNS panel for `mylanka.com.ua`, add the records below
(values come from Vercel after you bind the custom domain — Vercel shows
exact targets in **Settings → Domains**).

| Host | Type | Target | Notes |
|---|---|---|---|
| `mylanka.com.ua` (apex / `@`) | A | `76.76.21.21` (Vercel) | Main store + admin + API |
| `www.mylanka.com.ua` | CNAME | `cname.vercel-dns.com.` | Vercel will auto-redirect to apex |
| `tg.mylanka.com.ua` | CNAME | `cname.vercel-dns.com.` | Mini App (separate Vercel project) |
| `cdn.mylanka.com.ua` | CNAME | R2 endpoint | Optional — pretty image URLs |

Workflow:
1. In Vercel, **Settings → Domains** → add `mylanka.com.ua`. Vercel shows
   the exact A / CNAME values it expects.
2. In thehost panel, switch the domain's NS to thehost's DNS servers (if not
   already), then add the records above with TTL 300–3600.
3. Wait ~5–30 min for propagation. Vercel will auto-issue Let's Encrypt SSL
   once it can resolve the host.

(R2 → Cloudflare dashboard → bucket → **Settings** → **Custom Domain** → add
`cdn.mylanka.com.ua`. Cloudflare gives you a CNAME to point at from thehost
panel. Once green, set `R2_PUBLIC_URL=https://cdn.mylanka.com.ua` in Vercel
env.)

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
