# Mylanka Telegram Mini App

Vite + React 19 + TypeScript Telegram WebApp.

## Dev

```bash
cd telegram-miniapp
npm install
npm run dev
```

Opens on `http://localhost:5173`. `/api/*` requests are proxied to the
Next.js dev server on `http://localhost:3000` (start it separately with
`npm run dev` in the repo root).

The app detects whether it's running inside Telegram via
`window.Telegram.WebApp.initData`. Outside Telegram (plain browser tab)
it loads the catalog without auth so you can develop UI without a tunnel.
Checkout/orders auto-link to the Customer only when initData is present.

## Build

```bash
npm run build
```

Outputs static files to `dist/`.

## Deploy to Vercel (target: `tg.mylanka.com.ua`)

1. Push the repo (mini app lives at `telegram-miniapp/`).
2. In Vercel, create a new project from the same repo and set
   **Root Directory** = `telegram-miniapp`.
3. Framework Preset: **Other**. Vercel will pick up `vercel.json` which
   already sets `buildCommand`, `outputDirectory`, the `/api/*` rewrite
   to `https://mylanka.com.ua`, and Telegram-friendly headers.
4. Add the custom domain `tg.mylanka.com.ua` and update DNS as Vercel
   instructs.
5. (Optional) Restrict the project to your team in Vercel settings.

## Register with @BotFather

After deploy:

1. Open `@BotFather` in Telegram.
2. `/mybots` → choose `mylanka_shop_bot` → **Bot Settings** →
   **Menu Button** → **Configure menu button** → set URL to
   `https://tg.mylanka.com.ua` and label to `Магазин`.
3. (Optional) **Configure Mini App** → set the same URL to expose the
   "Launch" button in the bot profile.
4. **Inline mode**: `/setinline` → on → placeholder like
   `Шукати вишиванки, обереги…`. This enables the inline_query handler.

After this, the menu button in the bot profile opens the Mini App, and
inline mentions of `@mylanka_shop_bot` produce product search results
shareable to any chat.
