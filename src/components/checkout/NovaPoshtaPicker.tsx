"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type City = {
  ref: string;
  name: string;
  present: string;
  warehouses: number;
};

type Warehouse = {
  ref: string;
  number?: string;
  description: string;
  shortAddress?: string;
};

export type NovaPoshtaSelection = {
  cityRef: string;
  cityName: string;
  cityPresent: string;
  warehouseRef: string;
  warehouseDescription: string;
};

export function NovaPoshtaPicker({
  value,
  onChange,
}: {
  value?: Partial<NovaPoshtaSelection>;
  onChange: (selection: NovaPoshtaSelection | null) => void;
}) {
  const t = useTranslations("Checkout");
  const [cityQuery, setCityQuery] = useState(value?.cityPresent ?? "");
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<City | null>(
    value?.cityRef
      ? { ref: value.cityRef, name: value.cityName ?? "", present: value.cityPresent ?? "", warehouses: 0 }
      : null,
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseRef, setWarehouseRef] = useState(value?.warehouseRef ?? "");
  const [showCityList, setShowCityList] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<number | null>(null);

  // Debounced city search
  useEffect(() => {
    if (!cityQuery || cityQuery.length < 2 || cityQuery === city?.present) {
      setCities([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/novaposhta/cities?q=${encodeURIComponent(cityQuery)}`);
        const data = (await res.json()) as { items?: City[] };
        setCities(data.items ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [cityQuery, city?.present]);

  // Fetch warehouses when city changes
  useEffect(() => {
    if (!city?.ref) {
      setWarehouses([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/novaposhta/warehouses?settlementRef=${city.ref}`);
      const data = (await res.json()) as { items?: Warehouse[] };
      if (cancelled) return;
      const sorted = (data.items ?? []).sort((a, b) =>
        Number(a.number ?? 0) - Number(b.number ?? 0),
      );
      setWarehouses(sorted);
    })();
    return () => {
      cancelled = true;
    };
  }, [city?.ref]);

  // Bubble selection up
  useEffect(() => {
    if (!city || !warehouseRef) {
      onChange(null);
      return;
    }
    const w = warehouses.find((x) => x.ref === warehouseRef);
    if (!w) {
      onChange(null);
      return;
    }
    onChange({
      cityRef: city.ref,
      cityName: city.name,
      cityPresent: city.present,
      warehouseRef: w.ref,
      warehouseDescription: w.description,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.ref, warehouseRef, warehouses.length]);

  function selectCity(c: City) {
    setCity(c);
    setCityQuery(c.present);
    setShowCityList(false);
    setWarehouseRef("");
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
          {t("npCity")}
        </label>
        <input
          type="text"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setShowCityList(true);
            if (city && e.target.value !== city.present) {
              setCity(null);
              setWarehouseRef("");
            }
          }}
          onFocus={() => setShowCityList(true)}
          placeholder={t("npCityPlaceholder")}
          className="mt-1 w-full rounded-sm border border-border bg-cream px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          autoComplete="off"
        />
        {showCityList && cities.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-sm border border-border bg-cream shadow-md">
            {cities.map((c) => (
              <li key={c.ref}>
                <button
                  type="button"
                  onClick={() => selectCity(c)}
                  className={cn(
                    "block w-full px-3 py-2 text-left text-sm hover:bg-wheat",
                    c.warehouses === 0 && "text-muted",
                  )}
                >
                  <span className="text-bark">{c.present}</span>
                  {c.warehouses > 0 && (
                    <span className="ml-2 text-[10px] text-muted">
                      · {c.warehouses}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {loading && (
          <span className="absolute right-3 top-9 text-xs text-muted">…</span>
        )}
      </div>

      {city && (
        <div>
          <label className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
            {t("npWarehouse")}
          </label>
          <select
            value={warehouseRef}
            onChange={(e) => setWarehouseRef(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border bg-cream px-3 py-2 text-sm focus:border-terracotta focus:outline-none"
          >
            <option value="">{t("npWarehousePlaceholder")}</option>
            {warehouses.map((w) => (
              <option key={w.ref} value={w.ref}>
                {w.description}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
