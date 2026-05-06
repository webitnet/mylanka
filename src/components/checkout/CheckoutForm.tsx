"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import {
  cartSubtotal,
  useCartStore,
  type CartItem,
} from "@/lib/cart/store";
import { useHydrated } from "@/lib/cart/useHydrated";
import { formatUah } from "@/lib/utils";
import {
  NovaPoshtaPicker,
  type NovaPoshtaSelection,
} from "./NovaPoshtaPicker";
import type { CheckoutResponse } from "@/app/api/checkout/route";

type ShippingMethod = "NOVA_POSHTA" | "UKRPOSHTA" | "SELF_PICKUP" | "INTERNATIONAL";
type PaymentMethod = "LIQPAY" | "MONOBANK" | "CASH_ON_DELIVERY";

export function CheckoutForm() {
  const locale = useLocale() as "uk" | "en";
  const t = useTranslations("Checkout");
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const hydrated = useHydrated();

  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("NOVA_POSHTA");
  const [npSelection, setNpSelection] = useState<NovaPoshtaSelection | null>(null);
  const [ukrpAddress, setUkrpAddress] = useState("");
  const [intlAddress, setIntlAddress] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("CASH_ON_DELIVERY");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return <div className="py-10 text-center text-muted">…</div>;
  }

  if (items.length === 0) {
    return <div className="py-10 text-center text-muted">{t("emptyCart")}</div>;
  }

  const subtotal = cartSubtotal(items);

  function shippingPayload() {
    switch (shippingMethod) {
      case "NOVA_POSHTA":
        if (!npSelection) return null;
        return {
          method: "NOVA_POSHTA" as const,
          cityName: npSelection.cityPresent,
          warehouseDescription: npSelection.warehouseDescription,
        };
      case "UKRPOSHTA":
        if (!ukrpAddress.trim()) return null;
        return { method: "UKRPOSHTA" as const, address: ukrpAddress.trim() };
      case "SELF_PICKUP":
        return { method: "SELF_PICKUP" as const };
      case "INTERNATIONAL":
        if (!intlAddress.trim()) return null;
        return { method: "INTERNATIONAL" as const, address: intlAddress.trim() };
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const shipping = shippingPayload();
    if (!shipping) {
      setError(t("errors.INVALID_BODY"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contact,
          shipping,
          payment,
          notes: notes.trim() || undefined,
          locale,
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const code = (data?.error?.code as string) ?? "GENERIC";
        const messages = {
          INVALID_BODY: t("errors.INVALID_BODY"),
          EMPTY_CART: t("errors.EMPTY_CART"),
          PRODUCT_UNAVAILABLE: t("errors.PRODUCT_UNAVAILABLE"),
          STOCK_INSUFFICIENT: t("errors.STOCK_INSUFFICIENT"),
        } as Record<string, string>;
        setError(messages[code] ?? t("errors.GENERIC"));
        setSubmitting(false);
        return;
      }
      const ok = data as CheckoutResponse;

      // For card-based payments — create the provider payment and redirect.
      if (payment === "LIQPAY" || payment === "MONOBANK") {
        const path = payment === "LIQPAY"
          ? "/api/payments/liqpay/create"
          : "/api/payments/mono/create";
        const payRes = await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderNumber: ok.orderNumber, locale }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) {
          setError(t("errors.GENERIC"));
          setSubmitting(false);
          return;
        }
        clearCart();
        window.location.href = payData.redirectUrl as string;
        return;
      }

      // COD — straight to success page.
      clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(ok.orderNumber)}`);
    } catch {
      setError(t("errors.GENERIC"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-10">
        {/* Contact */}
        <Section title={t("contactSection")}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("firstName")}>
              <input
                required
                autoComplete="given-name"
                value={contact.firstName}
                onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                className="input"
              />
            </Field>
            <Field label={t("lastName")}>
              <input
                required
                autoComplete="family-name"
                value={contact.lastName}
                onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                className="input"
              />
            </Field>
            <Field label={t("email")}>
              <input
                required
                type="email"
                autoComplete="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className="input"
              />
            </Field>
            <Field label={t("phone")}>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                className="input"
              />
            </Field>
          </div>
        </Section>

        {/* Shipping */}
        <Section title={t("shippingSection")}>
          <div className="grid gap-2 md:grid-cols-2">
            {(["NOVA_POSHTA", "UKRPOSHTA", "SELF_PICKUP", "INTERNATIONAL"] as ShippingMethod[]).map((m) => (
              <RadioCard
                key={m}
                checked={shippingMethod === m}
                onClick={() => setShippingMethod(m)}
                label={t(
                  m === "NOVA_POSHTA"
                    ? "shippingMethodNP"
                    : m === "UKRPOSHTA"
                      ? "shippingMethodUkrposhta"
                      : m === "SELF_PICKUP"
                        ? "shippingMethodPickup"
                        : "shippingMethodIntl",
                )}
              />
            ))}
          </div>
          <div className="mt-5">
            {shippingMethod === "NOVA_POSHTA" && (
              <NovaPoshtaPicker onChange={setNpSelection} />
            )}
            {shippingMethod === "UKRPOSHTA" && (
              <Field label={t("intlAddress")}>
                <input
                  required
                  value={ukrpAddress}
                  onChange={(e) => setUkrpAddress(e.target.value)}
                  className="input"
                />
              </Field>
            )}
            {shippingMethod === "INTERNATIONAL" && (
              <Field label={t("intlAddress")}>
                <textarea
                  required
                  rows={3}
                  value={intlAddress}
                  onChange={(e) => setIntlAddress(e.target.value)}
                  className="input"
                />
              </Field>
            )}
          </div>
        </Section>

        {/* Payment */}
        <Section title={t("paymentSection")}>
          <div className="grid gap-2">
            {(["CASH_ON_DELIVERY", "LIQPAY", "MONOBANK"] as PaymentMethod[]).map((p) => (
              <RadioCard
                key={p}
                checked={payment === p}
                onClick={() => setPayment(p)}
                label={t(
                  p === "LIQPAY"
                    ? "paymentLiqpay"
                    : p === "MONOBANK"
                      ? "paymentMonobank"
                      : "paymentCOD",
                )}
              />
            ))}
          </div>
        </Section>

        <Section title={t("notes")}>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
          />
        </Section>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-sm border border-border bg-parchment/60 p-6">
        <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.2em] text-muted">
          {t("summarySection")}
        </h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {items.map((it) => (
            <SummaryRow key={it.slug} item={it} locale={locale} />
          ))}
        </ul>
        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">{t("subtotal")}</span>
            <span className="text-bark">{formatUah(subtotal, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">{t("shipping")}</span>
            <span className="text-muted">—</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-[family-name:var(--font-display)] text-lg text-bark">
            <span>{t("total")}</span>
            <span>{formatUah(subtotal, locale)}</span>
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-sm border border-embroidery/40 bg-embroidery/10 px-3 py-2 text-xs text-bark">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={submitting} className="mt-5 w-full">
          {submitting ? t("placing") : t("place")}
        </Button>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.2em] text-muted">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function RadioCard({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-sm border px-4 py-3 text-left text-sm transition ${
        checked ? "border-embroidery bg-linen/40 text-bark" : "border-border text-bark hover:border-bark"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full border-2 ${
          checked ? "border-embroidery bg-embroidery" : "border-border bg-parchment"
        }`}
      />
      {label}
    </button>
  );
}

function SummaryRow({ item, locale }: { item: CartItem; locale: "uk" | "en" }) {
  return (
    <li className="flex items-start justify-between gap-2 py-2 text-sm">
      <div>
        <p className="text-bark">
          {locale === "uk" ? item.nameUk : item.nameEn}
        </p>
        <p className="text-xs text-muted">× {item.qty}</p>
      </div>
      <span className="text-bark">
        {formatUah(item.priceUah * item.qty, locale)}
      </span>
    </li>
  );
}
