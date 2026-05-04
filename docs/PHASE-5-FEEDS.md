# Phase 5 — Instagram & Marketplace Feeds

Estimated: 1 week

## Instagram Shop

### Setup Steps

1. Create Facebook Business Page for "Рідне"
2. Create Meta Commerce Manager account
3. Create Product Catalog in Commerce Manager
4. Connect Instagram Business account
5. Submit shop for review (takes 1-5 days)

### Product Feed — `/api/feeds/meta-commerce`

Generate CSV that Commerce Manager imports:

```csv
id,title,description,availability,condition,price,link,image_link,brand,google_product_category
RDN-001,"Ceramic Cup - Hutsul Pattern","Handmade ceramic cup with traditional Hutsul ornament...",in stock,new,450.00 UAH,https://ridne.ua/products/ceramic-cup-hutsul,https://cdn.ridne.ua/images/cup-001.jpg,Рідне,6960
```

**Required fields:** id, title, description, availability, condition, price, link, image_link

**Implementation:**

```typescript
// /api/feeds/meta-commerce/route.ts
export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: { where: { isPrimary: true } }, category: true }
  });

  const header = 'id,title,description,availability,condition,price,link,image_link,brand';
  const rows = products.map(p => [
    p.sku,
    csvEscape(p.nameEn),
    csvEscape(p.shortDescEn || p.descEn.slice(0, 200)),
    p.stock > 0 ? 'in stock' : 'out of stock',
    'new',
    `${(p.priceUah / 100).toFixed(2)} UAH`,
    `https://ridne.ua/products/${p.slug}`,
    p.images[0]?.url || '',
    'Рідне'
  ].join(','));

  return new Response([header, ...rows].join('\n'), {
    headers: { 'Content-Type': 'text/csv' }
  });
}
```

**Feed update:** Set auto-import in Commerce Manager to pull from URL every 24h. Trigger manual refresh from admin panel.

**Instagram Shopping Tags:** Done manually in Instagram app — tag products in posts and stories.

---

## Prom.ua

### Feed Format: YML (Yandex Market Language)

**Endpoint:** `GET /api/feeds/prom`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="2026-05-04">
  <shop>
    <name>Рідне</name>
    <company>Рідне — Handmade Ukrainian Souvenirs</company>
    <url>https://ridne.ua</url>
    <currencies>
      <currency id="UAH" rate="1"/>
    </currencies>
    <categories>
      <category id="1">Кераміка</category>
      <category id="2" parentId="1">Посуд</category>
      <!-- ... -->
    </categories>
    <offers>
      <offer id="RDN-001" available="true">
        <url>https://ridne.ua/products/ceramic-cup-hutsul</url>
        <price>450</price>
        <currencyId>UAH</currencyId>
        <categoryId>2</categoryId>
        <picture>https://cdn.ridne.ua/images/cup-001.jpg</picture>
        <name>Керамічна чашка «Гуцульський візерунок»</name>
        <description>Ручна робота майстрів з Косова...</description>
        <vendor>Рідне</vendor>
        <param name="Матеріал">Кераміка</param>
        <param name="Регіон">Івано-Франківщина</param>
      </offer>
    </offers>
  </shop>
</yml_catalog>
```

**Implementation:**

```typescript
// /api/feeds/prom/route.ts
export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { images: true, category: { include: { parent: true } } }
  });
  const categories = await prisma.category.findMany({ where: { isActive: true } });

  const xml = generateYML(products, categories);

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}
```

**Prom.ua setup:**
1. Register as seller on prom.ua
2. Add automatic import → URL: `https://ridne.ua/api/feeds/prom`
3. Set update schedule: every 4-6 hours
4. Map Prom categories to Ridne categories

**Orders from Prom.ua:** Process manually or use Prom API to pull orders and create `Order` records with `source: PROM_UA`.

---

## Rozetka (Future)

Similar YML feed format. Endpoint: `GET /api/feeds/rozetka`
Same generator with Rozetka-specific category mapping.

---

## Centralized Inventory Sync

All channels read from `Product.stock`. Stock reduction flow:

```
1. Customer places order (any channel)
2. Backend creates Order + OrderItems
3. Stock reduced: product.stock -= quantity (in transaction)
4. If stock === 0 → "Out of stock" across all channels
5. If stock <= lowStockAt → admin notification
6. Feeds auto-reflect availability on next generation/pull
```

**Concurrency protection:**

```typescript
await prisma.$transaction(async (tx) => {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { stock: true }
  });

  if (product.stock < quantity) {
    throw new Error('INSUFFICIENT_STOCK');
  }

  await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } }
  });

  await tx.orderItem.create({ data: { ... } });
});
```

Use Prisma transactions with implicit row-level locking to prevent overselling.

---

## Feed API Summary

```
GET /api/feeds/meta-commerce   — CSV for Instagram/Facebook Shop
GET /api/feeds/prom            — YML for Prom.ua
GET /api/feeds/rozetka         — YML for Rozetka (future)
```

All feeds:
- Generated dynamically from database
- Cache with `stale-while-revalidate` (1 hour cache, regenerate in background)
- Only include `isActive: true` products
- Availability reflects real-time stock
