# Phase 2 — Payment Integration

Estimated: 1 week

## LiqPay

**Docs:** https://www.liqpay.ua/documentation

### Flow

1. Customer selects LiqPay at checkout
2. Backend creates payment:
   ```
   POST https://www.liqpay.ua/api/request
   {
     "action": "pay",
     "version": 3,
     "public_key": LIQPAY_PUBLIC_KEY,
     "amount": order.total / 100,   // kopecks → UAH
     "currency": "UAH",
     "description": "Замовлення RDN-20260504-001 | Ridne Store",
     "order_id": order.id,
     "result_url": "https://ridne.ua/checkout/success?order=ORDER_ID",
     "server_url": "https://ridne.ua/api/webhooks/liqpay"
   }
   ```
3. Redirect customer to LiqPay checkout
4. LiqPay POSTs callback to `server_url`

### Webhook Handler — `/api/webhooks/liqpay`

```typescript
// 1. Verify signature
const expectedSign = base64(sha1(PRIVATE_KEY + data + PRIVATE_KEY));
if (sign !== expectedSign) return 403;

// 2. Decode payload
const payload = JSON.parse(base64decode(data));

// 3. Check status
// success | failure | error | wait_accept | sandbox

// 4. Update records
if (payload.status === 'success') {
  await updatePayment(payload.order_id, { status: 'PAID', paidAt: new Date() });
  await updateOrder(payload.order_id, { paymentStatus: 'PAID', status: 'CONFIRMED' });
}
```

### Test Cards (sandbox)
Use `sandbox_` prefixed keys. Test card: `4242424242424242`, any expiry, any CVV.

---

## Monobank Acquiring

**Docs:** https://api.monobank.ua/docs/acquiring.html

### Flow

1. Backend creates invoice:
   ```
   POST https://api.monobank.ua/api/merchant/invoice/create
   Headers: X-Token: MONOBANK_TOKEN
   {
     "amount": order.total,        // already kopecks
     "ccy": 980,                   // UAH ISO code
     "merchantPaymInfo": {
       "reference": order.orderNumber,
       "destination": "Замовлення в Ridne Store"
     },
     "redirectUrl": "https://ridne.ua/checkout/success?order=ORDER_ID",
     "webHookUrl": "https://ridne.ua/api/webhooks/monobank"
   }
   ```
2. Response: `{ "pageUrl": "https://pay.mbnk.biz/..." }`
3. Redirect customer to `pageUrl`

### Webhook Handler — `/api/webhooks/monobank`

```typescript
// 1. Verify X-Sign header using Monobank public key
// 2. Parse body: { invoiceId, status, amount, ccy, ... }
// 3. Status: created | processing | hold | success | failure | reversed
// 4. Update payment + order
```

---

## Cash on Delivery

No integration needed:
- `Order.paymentProvider = CASH_ON_DELIVERY`
- `Order.paymentStatus = UNPAID`
- Admin marks as PAID after delivery confirmation

---

## Payment Method Selection UI

```tsx
<PaymentMethodSelector
  methods={[
    { id: 'liqpay', label: 'Банківська картка', icon: CreditCardIcon, description: 'Visa, Mastercard' },
    { id: 'monobank', label: 'Monobank', icon: MonobankIcon, description: 'Оплата через Monobank' },
    { id: 'cod', label: 'Накладений платіж', icon: CashIcon, description: 'Оплата при отриманні' },
  ]}
  selected={selectedMethod}
  onChange={setSelectedMethod}
/>
```

## API Endpoints

```
POST   /api/payments/liqpay/create   — Create LiqPay payment, return redirect URL
POST   /api/payments/mono/create     — Create Monobank invoice, return pageUrl
POST   /api/webhooks/liqpay          — LiqPay callback (no auth, verify signature)
POST   /api/webhooks/monobank        — Monobank callback (verify X-Sign)
```
