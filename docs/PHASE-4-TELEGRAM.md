# Phase 4 — Telegram Bot + Mini App

Estimated: 2 weeks

## Bot — `@RidneShopBot`

### Framework: grammY (TypeScript)

```bash
npm install grammy
```

### Commands

```
/start     — Welcome + open Mini App button
/catalog   — Open Mini App to catalog
/orders    — View order history
/help      — FAQ and contacts
/language  — Switch uk/en
```

### Bot Features

1. **Welcome message** with WebApp keyboard button:
   ```typescript
   bot.command('start', (ctx) => {
     ctx.reply('Ласкаво просимо до Рідне! 🇺🇦', {
       reply_markup: {
         keyboard: [[{
           text: '🛍 Відкрити магазин',
           web_app: { url: 'https://tg.ridne.ua' }
         }]],
         resize_keyboard: true
       }
     });
   });
   ```

2. **Inline mode** — search products, share in chats:
   ```typescript
   bot.on('inline_query', async (ctx) => {
     const results = await searchProducts(ctx.inlineQuery.query);
     await ctx.answerInlineQuery(results.map(p => ({
       type: 'article',
       id: p.id,
       title: p.nameUk,
       description: `₴${p.priceUah / 100}`,
       thumbnail_url: p.images[0]?.url,
       input_message_content: {
         message_text: `${p.nameUk}\n₴${p.priceUah / 100}\nhttps://ridne.ua/products/${p.slug}`
       }
     })));
   });
   ```

3. **Order notifications** to customer:
   ```
   ✅ Замовлення #RDN-20260504-001 підтверджено!
   📦 Відправлено! ТТН: 20450000123456. Відстежити: https://novaposhta.ua/...
   ```

4. **Admin notifications** to admin group chat (see Phase 3).

### Deployment

- Host on Railway or Fly.io
- Webhook mode (not polling): register webhook URL via BotFather
- Endpoint: `POST /api/telegram/webhook` (in Next.js) or standalone server

---

## Telegram Mini App

### Why separate from Next.js

Telegram WebApps must be fast and lightweight. A Vite + React app avoids Next.js SSR overhead. Target: < 200KB initial bundle.

### Tech Stack

```
Vite + React + TypeScript
@twa-dev/sdk             — Telegram WebApp SDK
Tailwind CSS (minimal)   — Shared design tokens with main store
```

### Setup

```bash
npm create vite@latest telegram-miniapp -- --template react-ts
cd telegram-miniapp
npm install @twa-dev/sdk
```

### Telegram SDK Integration

```typescript
import WebApp from '@twa-dev/sdk';

// User data (auto-authenticated)
const user = WebApp.initDataUnsafe.user;
// { id, first_name, last_name, username, language_code }

// Theme — adapt to user's Telegram theme
WebApp.setHeaderColor('#3D2B1F');       // bark
WebApp.setBackgroundColor('#FAF5EC');    // cream

// Main button (for checkout)
WebApp.MainButton.setText('Оформити — ₴1,250');
WebApp.MainButton.setParams({ color: '#C8593A', text_color: '#FAF5EC' });
WebApp.MainButton.show();
WebApp.MainButton.onClick(() => handleCheckout());

// Back button
WebApp.BackButton.show();
WebApp.BackButton.onClick(() => navigateBack());

// Haptic feedback
WebApp.HapticFeedback.impactOccurred('medium');  // on add to cart

// Close after order
WebApp.close();
```

### Pages / Views

1. **Catalog** — category tabs at top, product grid below
2. **Product Detail** — image carousel, description, variant selector, add to cart
3. **Cart** — item list, qty controls, subtotal
4. **Checkout** — name, phone, Nova Poshta (city + warehouse), payment method
5. **Order Confirmation** — order number, "Back to catalog" button

### Navigation

Use a simple in-app router (React Router or custom state):
- `catalog` → `product/:slug` → `cart` → `checkout` → `confirmation`
- Telegram BackButton handles going back
- No complex nested routes

### Authentication

No login needed. Users are auto-identified via Telegram:

```typescript
// Frontend: send initData with every API call
const headers = {
  'Content-Type': 'application/json',
  'X-Telegram-Init-Data': WebApp.initData
};

// Backend middleware: validate initData
import crypto from 'crypto';

function validateTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  return hash === expectedHash;
}
```

On valid initData → find or create Customer by `telegramId`.

### API Calls

Same backend as web store:
```typescript
const API_BASE = 'https://ridne.ua/api';

async function fetchProducts(category?: string) {
  const res = await fetch(`${API_BASE}/products?category=${category}`, {
    headers: { 'X-Telegram-Init-Data': WebApp.initData }
  });
  return res.json();
}
```

### Design Adaptations

- Use Telegram's `themeParams` as base, override with Ridne brand colors
- Terracotta CTAs, bark header, cream background
- Rounded corners on cards (Telegram-native feel)
- Simplified layout — no complex menus
- Bottom MainButton for primary actions
- Haptic feedback on interactions (add to cart, confirm)
- Large touch targets (44px minimum)

### Telegram Payments (Optional / Future)

Built-in payment without redirects:
```typescript
bot.api.sendInvoice(chatId, {
  title: 'Замовлення RDN-001',
  description: 'Керамічна чашка ×1',
  payload: JSON.stringify({ orderId: '...' }),
  provider_token: PAYMENT_PROVIDER_TOKEN,  // from BotFather
  currency: 'UAH',
  prices: [{ label: 'Кераміка', amount: 45000 }]
});
```

Requires payment provider connected via BotFather (LiqPay or Portmone for Ukraine).

### Deployment

- Build: `npm run build` → static files
- Host: Vercel as static site at `tg.ridne.ua`
- Register WebApp URL in BotFather: `tg.ridne.ua`
