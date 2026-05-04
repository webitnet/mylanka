# Phase 3 — Admin Panel

Estimated: 2-3 weeks

## Auth

- URL: `/admin` (same Next.js app)
- NextAuth.js with JWT strategy
- Email + password (bcrypt)
- Roles: `SUPER_ADMIN` | `MANAGER` | `CONTENT_EDITOR`
- Middleware: check session + role on all `/admin` and `/api/admin` routes
- Optional: TOTP 2FA (Google Authenticator)

## Dashboard — `/admin`

### Stats Cards (top row)
- Today's orders count
- Today's revenue (UAH)
- Pending orders (action needed)
- Low stock items count

### Charts
- Revenue: last 30 days line chart (Recharts)
- Orders by channel: pie chart (Web / Telegram / Instagram / Prom)

### Lists
- Recent orders (last 10): order #, customer, total, status, time
- Low stock alerts: product name, current stock, threshold
- Top selling products (this week)

### Real-time
- New order → push notification via Supabase Realtime or SSE
- Dashboard auto-refreshes stats

## Products — `/admin/products`

### List View
- Searchable table (name, SKU)
- Filter: category, status (active/inactive), stock (in stock / low / out)
- Columns: Thumb | Name | SKU | Price | Stock | Status | Actions
- Bulk actions: activate, deactivate, delete
- Quick inline edit: price, stock
- Pagination: 25 per page

### Product Editor — `/admin/products/new` and `/admin/products/[id]`

Tabbed form:

**Tab: General**
- Name UK / Name EN
- Slug (auto-generated from nameEn, editable)
- SKU
- Short description UK / EN
- Full description UK / EN (rich text — Tiptap editor)

**Tab: Pricing**
- Price UAH (input in UAH, store as kopecks)
- Compare price (for sale display)
- Cost price (for margin calc)
- Price USD (optional, manual)

**Tab: Images**
- Drag-and-drop upload (multi-file)
- Reorder by drag
- Set primary image (star icon)
- Alt text UK / EN per image
- Max 10 images per product

**Tab: Organization**
- Category (tree selector)
- Tags (multi-select with create-on-fly)
- Material (dropdown or free text)
- Artisan name
- Region of origin

**Tab: Variants** (optional)
- Add variant rows: Name UK/EN, SKU, Price override, Stock
- Delete variant
- Example: Size (Small/Large) or Color (Blue/Red)

**Tab: Inventory**
- Stock count
- Low stock threshold
- Track stock toggle

**Tab: SEO**
- Meta title UK / EN (with character count)
- Meta description UK / EN (with character count)
- Preview snippet

**Tab: Status**
- Active / Inactive toggle
- Featured toggle
- New Arrival toggle

## Orders — `/admin/orders`

### List View
- Filter: status, date range, source, payment status
- Columns: Order # | Customer | Items | Total | Status | Payment | Source | Date
- Quick status buttons (Confirm, Ship, etc.)
- Export: CSV download

### Order Detail — `/admin/orders/[id]`

**Customer Section**
- Name, email, phone
- Telegram ID (if from Telegram)
- Link to customer profile

**Items Section**
- Product image, name, SKU, variant, qty, unit price, line total
- Link to product editor

**Shipping Section**
- Method (Nova Poshta / Ukrposhta / Self-pickup / International)
- Address / warehouse info
- Tracking number input (editable)
- "Copy tracking" button

**Payment Section**
- Provider (LiqPay / Monobank / COD)
- Payment ID
- Amount, status
- Raw response (expandable JSON)

**Timeline**
- Status history with timestamps
- Auto-entries: created, payment received, confirmed, shipped, delivered
- Admin actions logged

**Actions**
- Confirm order (PENDING → CONFIRMED)
- Mark as processing (CONFIRMED → PROCESSING)
- Ship order (enter tracking # → SHIPPED)
- Cancel order (→ CANCELLED, restore stock)
- Refund (→ REFUNDED, trigger provider refund if applicable)

**Admin Notes**
- Internal notes textarea (not visible to customer)

## Customers — `/admin/customers`

- Searchable list (name, email, phone, telegram)
- Customer detail: contact info, order history, total spent, registration date
- Merge duplicate customers (by email/phone match)

## Settings — `/admin/settings`

- Store info: name, address, phone, email
- Shipping rates per method
- Payment provider toggle (enable/disable)
- Email templates (order confirmation, shipping notification)
- Promo codes: create, set discount (% or fixed), expiry, usage limit

## Telegram Notifications (Admin)

Bot sends to `TELEGRAM_ADMIN_CHAT_ID` group:

```
🛒 Нове замовлення!
#RDN-20260504-001
👤 Іван Петренко | +380991234567
📦 3 товари | ₴1,250
💳 LiqPay — Очікує оплати
🚚 Нова Пошта, відділення #15, Київ
```

```
💰 Оплата отримана!
#RDN-20260504-001 — ₴1,250 (LiqPay)
```

```
⚠️ Мало на складі!
Керамічна чашка «Гуцульський візерунок» — залишилось 3 шт.
```

## Admin API Endpoints

```
POST   /api/admin/products           — Create product
PATCH  /api/admin/products/[id]      — Update product
DELETE /api/admin/products/[id]      — Delete product
POST   /api/admin/products/[id]/images — Upload images
GET    /api/admin/orders             — List all orders
GET    /api/admin/orders/[id]        — Order detail
PATCH  /api/admin/orders/[id]        — Update order (status, tracking, notes)
GET    /api/admin/customers          — List customers
GET    /api/admin/customers/[id]     — Customer detail
GET    /api/admin/dashboard/stats    — Dashboard numbers
GET    /api/admin/dashboard/revenue  — Revenue chart data
GET    /api/admin/settings           — Store settings
PATCH  /api/admin/settings           — Update settings
```

All admin endpoints require NextAuth session with appropriate role.
