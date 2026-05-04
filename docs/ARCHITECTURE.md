# Architecture — DB Schema & Project Setup

## Setup Commands

```bash
npx create-next-app@latest ridne --typescript --tailwind --app --src-dir
cd ridne
npm install prisma @prisma/client next-intl next-auth @auth/prisma-adapter
npm install -D vitest @playwright/test
npx prisma init
```

## Database Schema (Prisma)

### Products

```prisma
model Category {
  id          String    @id @default(cuid())
  slug        String    @unique
  nameUk      String    @map("name_uk")
  nameEn      String    @map("name_en")
  descUk      String?   @map("desc_uk")
  descEn      String?   @map("desc_en")
  image       String?
  parentId    String?   @map("parent_id")
  parent      Category? @relation("SubCats", fields: [parentId], references: [id])
  children    Category[] @relation("SubCats")
  products    Product[]
  sortOrder   Int       @default(0) @map("sort_order")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  @@map("categories")
}

model Product {
  id            String    @id @default(cuid())
  sku           String    @unique
  slug          String    @unique
  nameUk        String    @map("name_uk")
  nameEn        String    @map("name_en")
  descUk        String    @map("desc_uk")
  descEn        String    @map("desc_en")
  shortDescUk   String?   @map("short_desc_uk")
  shortDescEn   String?   @map("short_desc_en")
  priceUah      Int       @map("price_uah")       // kopecks
  priceUsd      Int?      @map("price_usd")       // cents
  comparePrice  Int?      @map("compare_price")
  costPrice     Int?      @map("cost_price")
  categoryId    String    @map("category_id")
  category      Category  @relation(fields: [categoryId], references: [id])
  images        ProductImage[]
  variants      ProductVariant[]
  tags          ProductTag[]
  reviews       Review[]
  orderItems    OrderItem[]
  cartItems     CartItem[]
  stock         Int       @default(0)
  lowStockAt    Int       @default(5) @map("low_stock_at")
  trackStock    Boolean   @default(true) @map("track_stock")
  weight        Int?                               // grams
  dimensions    String?                            // "LxWxH cm"
  material      String?
  artisan       String?
  region        String?
  isActive      Boolean   @default(true) @map("is_active")
  isFeatured    Boolean   @default(false) @map("is_featured")
  isNewArrival  Boolean   @default(false) @map("is_new_arrival")
  metaTitleUk   String?   @map("meta_title_uk")
  metaTitleEn   String?   @map("meta_title_en")
  metaDescUk    String?   @map("meta_desc_uk")
  metaDescEn    String?   @map("meta_desc_en")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  @@index([categoryId])
  @@index([isActive, isFeatured])
  @@index([priceUah])
  @@map("products")
}

model ProductImage {
  id        String   @id @default(cuid())
  productId String   @map("product_id")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  altUk     String?  @map("alt_uk")
  altEn     String?  @map("alt_en")
  sortOrder Int      @default(0) @map("sort_order")
  isPrimary Boolean  @default(false) @map("is_primary")
  @@map("product_images")
}

model ProductVariant {
  id        String   @id @default(cuid())
  productId String   @map("product_id")
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  nameUk    String   @map("name_uk")
  nameEn    String   @map("name_en")
  sku       String   @unique
  priceUah  Int?     @map("price_uah")
  stock     Int      @default(0)
  isActive  Boolean  @default(true) @map("is_active")
  @@map("product_variants")
}

model Tag {
  id       String       @id @default(cuid())
  slug     String       @unique
  nameUk   String       @map("name_uk")
  nameEn   String       @map("name_en")
  products ProductTag[]
  @@map("tags")
}

model ProductTag {
  productId String  @map("product_id")
  tagId     String  @map("tag_id")
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([productId, tagId])
  @@map("product_tags")
}
```

### Orders & Cart

```prisma
model Cart {
  id         String     @id @default(cuid())
  sessionId  String?    @unique @map("session_id")
  customerId String?    @map("customer_id")
  customer   Customer?  @relation(fields: [customerId], references: [id])
  items      CartItem[]
  expiresAt  DateTime   @map("expires_at")
  createdAt  DateTime   @default(now()) @map("created_at")
  updatedAt  DateTime   @updatedAt @map("updated_at")
  @@map("carts")
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String   @map("cart_id")
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String   @map("product_id")
  product   Product  @relation(fields: [productId], references: [id])
  variantId String?  @map("variant_id")
  quantity  Int      @default(1)
  @@unique([cartId, productId, variantId])
  @@map("cart_items")
}

model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique @map("order_number")
  customerId      String?       @map("customer_id")
  customer        Customer?     @relation(fields: [customerId], references: [id])
  items           OrderItem[]
  payments        Payment[]
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(UNPAID) @map("payment_status")
  firstName       String        @map("first_name")
  lastName        String        @map("last_name")
  email           String
  phone           String
  shippingMethod  ShippingMethod @map("shipping_method")
  shippingAddress String?       @map("shipping_address")
  npCity          String?       @map("np_city")
  npWarehouse     String?       @map("np_warehouse")
  trackingNumber  String?       @map("tracking_number")
  subtotal        Int
  shippingCost    Int           @default(0) @map("shipping_cost")
  discount        Int           @default(0)
  total           Int
  source          OrderSource   @default(WEB)
  notes           String?
  adminNotes      String?       @map("admin_notes")
  locale          String        @default("uk")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  @@index([status])
  @@index([createdAt])
  @@index([customerId])
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String   @map("order_id")
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String   @map("product_id")
  product     Product  @relation(fields: [productId], references: [id])
  variantId   String?  @map("variant_id")
  nameUk      String   @map("name_uk")
  nameEn      String   @map("name_en")
  sku         String
  priceUah    Int      @map("price_uah")
  quantity    Int
  total       Int
  @@map("order_items")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  UNPAID
  PENDING
  PAID
  PARTIALLY_REFUNDED
  REFUNDED
  FAILED
}

enum ShippingMethod {
  NOVA_POSHTA
  UKRPOSHTA
  SELF_PICKUP
  INTERNATIONAL
}

enum OrderSource {
  WEB
  TELEGRAM
  INSTAGRAM
  PROM_UA
  ROZETKA
  OTHER
}
```

### Customers & Payments

```prisma
model Customer {
  id            String    @id @default(cuid())
  email         String?   @unique
  phone         String?   @unique
  firstName     String?   @map("first_name")
  lastName      String?   @map("last_name")
  telegramId    String?   @unique @map("telegram_id")
  instagramId   String?   @unique @map("instagram_id")
  locale        String    @default("uk")
  orders        Order[]
  carts         Cart[]
  reviews       Review[]
  addresses     Address[]
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  @@map("customers")
}

model Address {
  id          String    @id @default(cuid())
  customerId  String    @map("customer_id")
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  label       String?
  firstName   String    @map("first_name")
  lastName    String    @map("last_name")
  phone       String
  city        String
  address     String
  npWarehouse String?   @map("np_warehouse")
  isDefault   Boolean   @default(false) @map("is_default")
  @@map("addresses")
}

model Payment {
  id              String          @id @default(cuid())
  orderId         String          @map("order_id")
  order           Order           @relation(fields: [orderId], references: [id])
  provider        PaymentProvider
  externalId      String?         @map("external_id")
  amount          Int
  currency        String          @default("UAH")
  status          PaymentStatus   @default(PENDING)
  rawResponse     Json?           @map("raw_response")
  paidAt          DateTime?       @map("paid_at")
  createdAt       DateTime        @default(now()) @map("created_at")
  @@map("payments")
}

enum PaymentProvider {
  LIQPAY
  MONOBANK
  CASH_ON_DELIVERY
}

model Review {
  id         String    @id @default(cuid())
  productId  String    @map("product_id")
  product    Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  customerId String    @map("customer_id")
  customer   Customer  @relation(fields: [customerId], references: [id])
  rating     Int
  comment    String?
  isApproved Boolean   @default(false) @map("is_approved")
  createdAt  DateTime  @default(now()) @map("created_at")
  @@map("reviews")
}

model AdminUser {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  name         String
  role         AdminRole @default(MANAGER)
  isActive     Boolean   @default(true) @map("is_active")
  lastLoginAt  DateTime? @map("last_login_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  @@map("admin_users")
}

enum AdminRole {
  SUPER_ADMIN
  MANAGER
  CONTENT_EDITOR
}
```

## Product Categories (Seed)

```
ceramics/           — Кераміка
  ├── tableware/    — Посуд
  ├── figurines/    — Фігурки
  └── decorative/   — Декоративна
textiles/           — Текстиль
  ├── vyshyvanky/   — Вишиванки
  ├── rushnyky/     — Рушники
  └── accessories/  — Аксесуари
woodwork/           — Дерев'яні вироби
  ├── kitchenware/  — Кухонне
  ├── boxes/        — Скриньки
  └── toys/         — Іграшки
jewelry/            — Прикраси
  ├── necklaces/    — Намиста
  ├── earrings/     — Сережки
  └── brooches/     — Брошки
art/                — Живопис і графіка
magnets/            — Магніти
gifts/              — Подарункові набори
regional/           — Регіональні
  ├── carpathian/   — Карпатські
  ├── hutsul/       — Гуцульські
  └── cossack/      — Козацькі
```

Seed 20-30 products with realistic names, descriptions (UK+EN), prices (500-50000 kopecks), and placeholder images from Unsplash.
