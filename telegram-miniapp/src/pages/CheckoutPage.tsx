import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import {
  createMonoPayment,
  listWarehouses,
  searchCities,
  submitCheckout,
  type Customer,
  type NpCity,
  type NpWarehouse,
} from "@/lib/api";
import { uah } from "@/lib/format";
import { useMainButton } from "@/lib/mainButton";
import { haptic, getWebApp } from "@/lib/telegram";

type Payment = "MONOBANK" | "CASH_ON_DELIVERY";

export function CheckoutPage({
  customer,
  onPlaced,
}: {
  customer: Customer | null;
  onPlaced: (orderNumber: string) => void;
}) {
  const { items, subtotal, clear } = useCart();

  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "+380");

  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<NpCity[]>([]);
  const [city, setCity] = useState<NpCity | null>(null);
  const [warehouses, setWarehouses] = useState<NpWarehouse[]>([]);
  const [warehouse, setWarehouse] = useState<NpWarehouse | null>(null);

  const [payment, setPayment] = useState<Payment>("CASH_ON_DELIVERY");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // City autocomplete (debounced)
  useEffect(() => {
    const q = cityQuery.trim();
    if (q.length < 2) {
      setCities([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await searchCities(q);
        if (!cancelled) setCities(res);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [cityQuery]);

  // Warehouses for selected city
  useEffect(() => {
    if (!city) {
      setWarehouses([]);
      setWarehouse(null);
      return;
    }
    listWarehouses(city.ref)
      .then(setWarehouses)
      .catch(() => setWarehouses([]));
  }, [city]);

  const formValid = Boolean(
    items.length > 0 &&
      firstName.trim() &&
      lastName.trim() &&
      /^\S+@\S+\.\S+$/.test(email) &&
      phone.replace(/\D/g, "").length >= 10 &&
      city &&
      warehouse,
  );

  const handleSubmit = useCallback(async () => {
    if (!formValid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const order = await submitCheckout({
        contact: { firstName, lastName, email, phone },
        shipping: {
          method: "NOVA_POSHTA",
          cityName: city!.name,
          warehouseDescription: warehouse!.description,
        },
        payment,
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        locale: "uk",
      });

      if (payment === "MONOBANK") {
        try {
          const { redirectUrl } = await createMonoPayment(order.orderNumber);
          getWebApp()?.HapticFeedback.notificationOccurred("success");
          clear();
          // Open the payment URL in the Telegram in-app browser.
          window.open(redirectUrl, "_blank");
          onPlaced(order.orderNumber);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Помилка створення платежу");
          setSubmitting(false);
          return;
        }
      } else {
        getWebApp()?.HapticFeedback.notificationOccurred("success");
        clear();
        onPlaced(order.orderNumber);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка оформлення");
      setSubmitting(false);
    }
  }, [
    formValid,
    submitting,
    firstName,
    lastName,
    email,
    phone,
    city,
    warehouse,
    payment,
    items,
    clear,
    onPlaced,
  ]);

  useMainButton({
    text: submitting
      ? "Оформлення…"
      : formValid
        ? `Підтвердити · ${uah(subtotal)}`
        : "Заповніть форму",
    onClick: () => {
      haptic("medium");
      handleSubmit();
    },
    enabled: formValid && !submitting,
  });

  return (
    <div className="pb-32">
      <header className="px-4 py-4 border-b border-border">
        <h1 className="text-xl font-semibold text-bark">Оформлення</h1>
      </header>

      <div className="p-4 space-y-6">
        <Section title="Контакти">
          <Field label="Імʼя" required>
            <input className="input-mini" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Прізвище" required>
            <input className="input-mini" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
          <Field label="Email" required>
            <input className="input-mini" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Телефон" required>
            <input className="input-mini" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </Section>

        <Section title="Доставка · Нова Пошта">
          <Field label="Місто" required>
            <input
              className="input-mini"
              value={city ? city.name : cityQuery}
              onChange={(e) => {
                setCity(null);
                setCityQuery(e.target.value);
              }}
              placeholder="Київ"
            />
            {!city && cities.length > 0 && (
              <ul className="mt-1 border border-border rounded-md bg-parchment overflow-hidden">
                {cities.map((c) => (
                  <li key={c.ref}>
                    <button
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setCityQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-linen"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Відділення" required>
            <select
              className="input-mini"
              disabled={!city}
              value={warehouse?.ref ?? ""}
              onChange={(e) => {
                const next = warehouses.find((w) => w.ref === e.target.value) ?? null;
                setWarehouse(next);
              }}
            >
              <option value="">— оберіть —</option>
              {warehouses.map((w) => (
                <option key={w.ref} value={w.ref}>
                  {w.description}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Оплата">
          <RadioRow
            checked={payment === "CASH_ON_DELIVERY"}
            onClick={() => setPayment("CASH_ON_DELIVERY")}
            label="При отриманні"
          />
          <RadioRow
            checked={payment === "MONOBANK"}
            onClick={() => setPayment("MONOBANK")}
            label="Картка через Monobank"
          />
        </Section>

        {error && (
          <p className="rounded-md border border-embroidery/40 bg-embroidery/10 px-3 py-2 text-xs text-bark">
            {error}
          </p>
        )}

        <div className="rounded-md border border-border bg-linen/30 p-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Позицій</span>
            <span className="text-bark">{items.length}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-bark border-t border-border pt-2">
            <span>До сплати</span>
            <span>{uah(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[10px] uppercase tracking-[0.25em] text-bark">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted">
        {label}
        {required && <span className="text-embroidery"> *</span>}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function RadioRow({
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
      className={`w-full flex items-center gap-3 rounded-md border px-3 py-3 text-left text-sm ${
        checked ? "border-embroidery bg-embroidery/5" : "border-border"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full border-2 ${
          checked ? "border-embroidery bg-embroidery" : "border-border bg-parchment"
        }`}
      />
      <span className="text-bark">{label}</span>
    </button>
  );
}
