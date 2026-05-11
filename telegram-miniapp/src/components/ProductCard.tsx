import type { ProductListItem } from "@/lib/api";

function uah(kopecks: number): string {
  return `₴${(kopecks / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function ProductCard({
  product,
  onClick,
}: {
  product: ProductListItem;
  onClick?: () => void;
}) {
  const outOfStock = product.trackStock && product.stock === 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg border border-border bg-linen/40 overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="aspect-square bg-parchment border-b border-border overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.nameUk}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted text-xs">
            нема фото
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-bark line-clamp-2 leading-tight min-h-[2.5rem]">
          {product.nameUk}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-bark">{uah(product.priceUah)}</span>
          {product.comparePrice && product.comparePrice > product.priceUah && (
            <span className="text-xs text-muted line-through">
              {uah(product.comparePrice)}
            </span>
          )}
        </div>
        {outOfStock && (
          <p className="mt-1 text-[11px] uppercase tracking-wider text-embroidery">
            Немає в наявності
          </p>
        )}
      </div>
    </button>
  );
}
