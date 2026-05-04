# Phase 1 — Core Store (Web App)

Estimated: 3-4 weeks

## Pages & Routes

```
/                           → Homepage
/products                   → Catalog (filters, sorting, pagination)
/products/[slug]            → Product detail
/categories/[slug]          → Category page
/cart                       → Shopping cart
/checkout                   → Checkout flow
/checkout/success           → Order confirmation
/about                      → About the shop
/contact                    → Contact + form
/shipping                   → Shipping & returns
/search                     → Search results
/[locale]/...               → All routes support /uk/ and /en/
```

## Homepage Sections

1. **Hero** — full-width image, brand tagline, "Shop Now" CTA
2. **Featured Products** — 4-8 products, horizontal scroll on mobile
3. **Categories** — visual cards, 2-3 column grid
4. **New Arrivals** — latest products grid
5. **About / Story** — short brand story, artisan photo
6. **Instagram Feed** — latest 6 posts (static or API)
7. **Newsletter** — email input + Telegram link
8. **Footer** — navigation, contacts, social links, payment badges

## Product Catalog

### Filters (sidebar desktop, bottom sheet mobile)
- Category (tree with subcategories)
- Price range (slider or min/max)
- Material (checkbox: ceramic, wood, textile...)
- Region of origin (checkbox)
- In stock only (toggle)
- Tags (new, sale, bestseller)

### Sorting
- Newest first (default)
- Price: low → high
- Price: high → low
- Popularity (order count)
- Rating

### Pagination
Infinite scroll + "Load more" fallback. 24 products per page.

### Product Card
- Primary image (4:5 aspect ratio)
- Product name (bilingual)
- Price UAH (optionally USD)
- Compare price (strikethrough if on sale)
- "New" / "Sale" badge
- Quick "Add to Cart" on hover
- Rating stars

## Product Detail Page

### Layout
- Image gallery (main + thumbnails, swipeable on mobile)
- Name, price, rating
- Short description
- Variant selector (if applicable)
- Quantity selector
- "Add to Cart" (sticky on mobile)
- Tabs/accordion: Description, Materials, Artisan, Shipping, Reviews
- Related products carousel
- Recently viewed section

### SEO
- `generateStaticParams` for SSG
- JSON-LD: Product, BreadcrumbList, Review
- Open Graph + Twitter Card meta

## Shopping Cart

- **Anonymous:** localStorage, synced to DB on login
- **Logged in:** DB-persisted
- Cart merge on login
- Real-time stock validation on cart open
- Line items: image, name, variant, qty (editable), unit price, line total
- Subtotal, shipping estimate, total
- "Continue Shopping" + "Proceed to Checkout"
- Navbar cart icon with count badge

## Checkout

Single-page, sectioned:

### 1. Contact Info
- Email (required)
- Phone (required)
- Option to create account

### 2. Shipping Method
- **Nova Poshta** — city search + warehouse selector (Nova Poshta API)
- **Ukrposhta** — address fields
- **Self-pickup** — store address + map
- **International** — address + country selector

### 3. Payment Method
- LiqPay (card)
- Monobank (bank link)
- Cash on delivery

### 4. Order Summary
- Itemized list, totals
- Promo code input

### 5. Place Order
After submit:
1. Create `Order` (status: PENDING)
2. Redirect to `/checkout/success`
3. Send confirmation (email or Telegram)
4. Reduce stock
5. Notify admin via Telegram bot

## Internationalization

Use `next-intl`:
```
/messages/uk.json    — Ukrainian
/messages/en.json    — English
```
- Product content bilingual in DB (`nameUk`/`nameEn`)
- Language toggle in header
- Cookie-persisted preference
- URL: `/uk/...` (default, no prefix needed) and `/en/...`

## Search

**Option A (recommended):** Meilisearch
- Index: products (id, nameUk, nameEn, descUk, descEn, category, tags, material, region, price)
- Typo tolerance, Ukrainian language, faceted search
- Sync via webhook on product CRUD

**Option B (MVP):** PostgreSQL `tsvector` full-text search

Frontend: debounced input → results dropdown + full results page

## API Endpoints (Phase 1)

```
GET    /api/products                — List (paginated, filterable)
GET    /api/products/[slug]         — Detail
GET    /api/products/search?q=      — Search
GET    /api/categories              — Category tree
GET    /api/categories/[slug]       — Category + products
GET    /api/cart                    — Current cart
POST   /api/cart/items              — Add item
PATCH  /api/cart/items/[id]         — Update qty
DELETE /api/cart/items/[id]         — Remove item
POST   /api/checkout               — Create order
GET    /api/checkout/shipping       — Shipping options
GET    /api/orders                  — Customer orders (auth)
GET    /api/orders/[id]             — Order detail
GET    /api/novaposhta/cities?q=    — Search cities
GET    /api/novaposhta/warehouses?city= — Warehouses
```

## Nova Poshta API

API v2.0: `https://api.novaposhta.ua/v2.0/json/`

Key methods:
- `Address.getSettlements` — search cities by name
- `Address.getWarehouses` — list warehouses in city

Build a reusable `NovaPoshtaSelector` component with city autocomplete → warehouse dropdown.
