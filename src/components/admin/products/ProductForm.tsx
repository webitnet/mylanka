"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { ProductInputT } from "@/lib/admin/products";

export type ProductFormDefaults = Partial<ProductInputT> & {
  imageUrls?: string[];
};

export type CategoryOption = { id: string; label: string };

type Mode = "create" | "edit";

export function ProductForm({
  mode,
  productId,
  defaults,
  categories,
  action,
}: {
  mode: Mode;
  productId?: string;
  defaults: ProductFormDefaults;
  categories: CategoryOption[];
  action: (input: ProductInputT) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [sku, setSku] = useState(defaults.sku ?? "");
  const [slug, setSlug] = useState(defaults.slug ?? "");
  const [nameUk, setNameUk] = useState(defaults.nameUk ?? "");
  const [nameEn, setNameEn] = useState(defaults.nameEn ?? "");
  const [shortDescUk, setShortDescUk] = useState(defaults.shortDescUk ?? "");
  const [shortDescEn, setShortDescEn] = useState(defaults.shortDescEn ?? "");
  const [descUk, setDescUk] = useState(defaults.descUk ?? "");
  const [descEn, setDescEn] = useState(defaults.descEn ?? "");
  const [priceUah, setPriceUah] = useState(
    defaults.priceUahKopecks != null ? (defaults.priceUahKopecks / 100).toString() : "",
  );
  const [comparePrice, setComparePrice] = useState(
    defaults.comparePriceKopecks != null
      ? (defaults.comparePriceKopecks / 100).toString()
      : "",
  );
  const [costPrice, setCostPrice] = useState(
    defaults.costPriceKopecks != null ? (defaults.costPriceKopecks / 100).toString() : "",
  );
  const [categoryId, setCategoryId] = useState(defaults.categoryId ?? "");
  const [stock, setStock] = useState(String(defaults.stock ?? 0));
  const [lowStockAt, setLowStockAt] = useState(String(defaults.lowStockAt ?? 5));
  const [trackStock, setTrackStock] = useState(defaults.trackStock ?? true);
  const [material, setMaterial] = useState(defaults.material ?? "");
  const [artisan, setArtisan] = useState(defaults.artisan ?? "");
  const [region, setRegion] = useState(defaults.region ?? "");
  const [weight, setWeight] = useState(
    defaults.weight != null ? String(defaults.weight) : "",
  );
  const [dimensions, setDimensions] = useState(defaults.dimensions ?? "");
  const [isActive, setIsActive] = useState(defaults.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(defaults.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(defaults.isNewArrival ?? false);
  const [metaTitleUk, setMetaTitleUk] = useState(defaults.metaTitleUk ?? "");
  const [metaTitleEn, setMetaTitleEn] = useState(defaults.metaTitleEn ?? "");
  const [metaDescUk, setMetaDescUk] = useState(defaults.metaDescUk ?? "");
  const [metaDescEn, setMetaDescEn] = useState(defaults.metaDescEn ?? "");
  const [imageUrlsText, setImageUrlsText] = useState(
    (defaults.imageUrls ?? []).join("\n"),
  );

  function uahToKopecks(s: string): number | null {
    const trimmed = s.trim();
    if (!trimmed) return null;
    const n = Number(trimmed.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return NaN;
    return Math.round(n * 100);
  }

  function autoSlug() {
    if (!nameEn) return;
    const next = nameEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    if (next) setSlug(next);
  }

  function buildInput(): ProductInputT | { error: string } {
    const priceK = uahToKopecks(priceUah);
    if (priceK === null) return { error: "Вкажіть ціну" };
    if (Number.isNaN(priceK)) return { error: "Невірна ціна" };
    const compareK = comparePrice ? uahToKopecks(comparePrice) : null;
    if (compareK !== null && Number.isNaN(compareK))
      return { error: "Невірна compare price" };
    const costK = costPrice ? uahToKopecks(costPrice) : null;
    if (costK !== null && Number.isNaN(costK))
      return { error: "Невірна cost price" };

    const stockNum = Number(stock);
    const lowStockNum = Number(lowStockAt);
    const weightNum = weight ? Number(weight) : null;
    if (
      !Number.isInteger(stockNum) ||
      !Number.isInteger(lowStockNum) ||
      stockNum < 0 ||
      lowStockNum < 0
    ) {
      return { error: "Stock / поріг низького запасу мають бути цілими числами ≥ 0" };
    }
    if (weightNum !== null && (!Number.isInteger(weightNum) || weightNum < 0)) {
      return { error: "Вага має бути цілим числом ≥ 0" };
    }

    const imageUrls = imageUrlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const url of imageUrls) {
      try {
        new URL(url);
      } catch {
        return { error: `Невалідне посилання на зображення: ${url}` };
      }
    }

    return {
      sku: sku.trim(),
      slug: slug.trim(),
      nameUk: nameUk.trim(),
      nameEn: nameEn.trim(),
      shortDescUk: shortDescUk.trim() || null,
      shortDescEn: shortDescEn.trim() || null,
      descUk: descUk.trim(),
      descEn: descEn.trim(),
      priceUahKopecks: priceK,
      comparePriceKopecks: compareK,
      costPriceKopecks: costK,
      categoryId,
      stock: stockNum,
      lowStockAt: lowStockNum,
      trackStock,
      material: material.trim() || null,
      artisan: artisan.trim() || null,
      region: region.trim() || null,
      weight: weightNum,
      dimensions: dimensions.trim() || null,
      isActive,
      isFeatured,
      isNewArrival,
      metaTitleUk: metaTitleUk.trim() || null,
      metaTitleEn: metaTitleEn.trim() || null,
      metaDescUk: metaDescUk.trim() || null,
      metaDescEn: metaDescEn.trim() || null,
      imageUrls,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const built = buildInput();
    if ("error" in built) {
      setError(built.error);
      return;
    }
    startTransition(async () => {
      try {
        await action(built);
        // create() redirects on success → won't reach here
        setSavedAt(new Date());
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Помилка збереження";
        // Filter out Next.js internal redirect "errors"
        if (msg.includes("NEXT_REDIRECT")) return;
        setError(msg);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-20">
      <Section title="Назва і ідентифікатори">
        <Grid2>
          <Field label="Назва (UA)" required>
            <input className="input" required value={nameUk} onChange={(e) => setNameUk(e.target.value)} />
          </Field>
          <Field label="Назва (EN)" required>
            <input className="input" required value={nameEn} onChange={(e) => setNameEn(e.target.value)} onBlur={() => { if (!slug) autoSlug(); }} />
          </Field>
          <Field label="Slug" required hint="Тільки a–z, 0–9, дефіси">
            <div className="flex gap-2">
              <input className="input" required value={slug} onChange={(e) => setSlug(e.target.value)} />
              <button type="button" onClick={autoSlug} className="rounded-sm border border-border px-3 text-xs uppercase tracking-wider text-muted hover:text-bark">
                Авто
              </button>
            </div>
          </Field>
          <Field label="SKU" required>
            <input className="input" required value={sku} onChange={(e) => setSku(e.target.value)} />
          </Field>
        </Grid2>
      </Section>

      <Section title="Опис">
        <Grid2>
          <Field label="Короткий опис (UA)">
            <textarea className="input" rows={2} value={shortDescUk} onChange={(e) => setShortDescUk(e.target.value)} />
          </Field>
          <Field label="Короткий опис (EN)">
            <textarea className="input" rows={2} value={shortDescEn} onChange={(e) => setShortDescEn(e.target.value)} />
          </Field>
          <Field label="Повний опис (UA)" required>
            <textarea className="input" rows={6} required value={descUk} onChange={(e) => setDescUk(e.target.value)} />
          </Field>
          <Field label="Повний опис (EN)" required>
            <textarea className="input" rows={6} required value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          </Field>
        </Grid2>
      </Section>

      <Section title="Ціни">
        <Grid3>
          <Field label="Ціна, ₴" required>
            <input className="input" inputMode="decimal" required value={priceUah} onChange={(e) => setPriceUah(e.target.value)} />
          </Field>
          <Field label="Стара ціна, ₴" hint="Для відображення знижки">
            <input className="input" inputMode="decimal" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} />
          </Field>
          <Field label="Собівартість, ₴" hint="Внутрішнє">
            <input className="input" inputMode="decimal" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
          </Field>
        </Grid3>
      </Section>

      <Section title="Категорія і атрибути">
        <Grid2>
          <Field label="Категорія" required>
            <select className="input" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— оберіть —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Матеріал">
            <input className="input" value={material} onChange={(e) => setMaterial(e.target.value)} />
          </Field>
          <Field label="Майстер">
            <input className="input" value={artisan} onChange={(e) => setArtisan(e.target.value)} />
          </Field>
          <Field label="Регіон">
            <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} />
          </Field>
          <Field label="Вага, г">
            <input className="input" inputMode="numeric" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </Field>
          <Field label="Габарити" hint="LxWxH см">
            <input className="input" value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
          </Field>
        </Grid2>
      </Section>

      <Section title="Залишок">
        <Grid3>
          <Field label="На складі">
            <input className="input" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
          </Field>
          <Field label="Поріг низького залишку">
            <input className="input" inputMode="numeric" value={lowStockAt} onChange={(e) => setLowStockAt(e.target.value)} />
          </Field>
          <Field label="Облік залишку">
            <Toggle checked={trackStock} onChange={setTrackStock} label={trackStock ? "Увімкнено" : "Вимкнено"} />
          </Field>
        </Grid3>
      </Section>

      <Section title="Зображення" hint="По одному URL на рядок (макс. 10). Перше — головне.">
        <textarea className="input font-mono text-xs" rows={5} value={imageUrlsText} onChange={(e) => setImageUrlsText(e.target.value)} placeholder="https://example.com/image-1.jpg&#10;https://example.com/image-2.jpg" />
      </Section>

      <Section title="SEO">
        <Grid2>
          <Field label="Meta title (UA)">
            <input className="input" value={metaTitleUk} onChange={(e) => setMetaTitleUk(e.target.value)} />
          </Field>
          <Field label="Meta title (EN)">
            <input className="input" value={metaTitleEn} onChange={(e) => setMetaTitleEn(e.target.value)} />
          </Field>
          <Field label="Meta description (UA)">
            <textarea className="input" rows={2} value={metaDescUk} onChange={(e) => setMetaDescUk(e.target.value)} />
          </Field>
          <Field label="Meta description (EN)">
            <textarea className="input" rows={2} value={metaDescEn} onChange={(e) => setMetaDescEn(e.target.value)} />
          </Field>
        </Grid2>
      </Section>

      <Section title="Статус">
        <div className="flex flex-wrap gap-6">
          <Toggle checked={isActive} onChange={setIsActive} label="Активний" />
          <Toggle checked={isFeatured} onChange={setIsFeatured} label="У вибраному" />
          <Toggle checked={isNewArrival} onChange={setIsNewArrival} label="Новинка" />
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-8 border-t border-border bg-parchment/95 px-8 py-4 backdrop-blur">
        {error && (
          <p className="mb-3 rounded-sm border border-embroidery/40 bg-embroidery/10 px-3 py-2 text-xs text-bark">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {savedAt && `Збережено о ${savedAt.toLocaleTimeString("uk-UA")}`}
          </p>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Збереження…" : mode === "create" ? "Створити" : "Зберегти"}
          </Button>
        </div>
      </div>

      {productId && (
        <input type="hidden" name="productId" value={productId} />
      )}
    </form>
  );
}

// ─── helpers ───────────────────────────────────────────────────────

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-linen/30 p-6">
      <h2 className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.25em] text-bark">
        {title}
      </h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-3">{children}</div>;
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
        {label}
        {required && <span className="ml-1 text-embroidery">*</span>}
      </span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition ${
        checked ? "border-embroidery bg-embroidery/10 text-bark" : "border-border text-muted hover:text-bark"
      }`}
    >
      <span
        className={`h-3 w-3 rounded-full border-2 ${
          checked ? "border-embroidery bg-embroidery" : "border-border"
        }`}
      />
      {label}
    </button>
  );
}
