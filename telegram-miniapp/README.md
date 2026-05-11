# Mylanka Telegram Mini App

Vite + React + TypeScript Telegram WebApp.

## Dev

```bash
cd telegram-miniapp
npm install
npm run dev
```

Opens on `http://localhost:5173`. `/api/*` requests are proxied to the
Next.js dev server on `http://localhost:3000` (start it separately with
`npm run dev` in the repo root).

The app detects whether it's running inside Telegram via `WebApp.initData`.
Outside Telegram (plain browser tab) it loads the catalog without auth so
you can develop UI without a tunnel. Checkout/orders require real initData.

## Build

```bash
npm run build
```

Outputs static files to `dist/`. Deploy to Vercel as a static site at
`tg.mylanka.com.ua` (see docs/PHASE-6-DEPLOY.md when Phase 7 lands).
After deploy, register the WebApp URL in @BotFather → bot → Bot Settings →
Menu Button → set URL.
