import { useCallback } from "react";
import { useCart } from "@/lib/cart";
import { uah } from "@/lib/format";
import { useMainButton } from "@/lib/mainButton";
import { haptic } from "@/lib/telegram";

export function CartPage({ onCheckout }: { onCheckout: () => void }) {
  const { items, setQty, remove, subtotal, count } = useCart();

  const empty = items.length === 0;

  const goCheckout = useCallback(() => {
    haptic("medium");
    onCheckout();
  }, [onCheckout]);

  useMainButton({
    text: empty ? "Кошик порожній" : `Оформити · ${uah(subtotal)}`,
    onClick: goCheckout,
    enabled: !empty,
  });

  return (
    <div className="pb-32">
      <header className="px-4 py-4 border-b border-border">
        <h1 className="text-xl font-semibold text-bark">
          Кошик {count > 0 && <span className="text-muted font-normal">· {count}</span>}
        </h1>
      </header>

      {empty ? (
        <div className="p-6 text-center text-sm text-muted">
          Кошик порожній. Поверніться до каталогу, щоб додати товари.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.slug} className="flex items-start gap-3 p-4">
              {it.image ? (
                <img src={it.image} alt={it.nameUk} className="h-20 w-20 rounded-md border border-border object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-md border border-border bg-parchment" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-bark line-clamp-2">{it.nameUk}</p>
                <p className="mt-1 text-bark">{uah(it.priceUah)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <QtyButton onClick={() => setQty(it.slug, it.qty - 1)}>−</QtyButton>
                  <span className="text-sm tabular-nums w-6 text-center">{it.qty}</span>
                  <QtyButton
                    onClick={() => setQty(it.slug, it.qty + 1)}
                    disabled={it.qty >= it.stock}
                  >
                    +
                  </QtyButton>
                  <button
                    type="button"
                    onClick={() => remove(it.slug)}
                    className="ml-auto text-[11px] uppercase tracking-wider text-embroidery"
                  >
                    Видалити
                  </button>
                </div>
              </div>
              <span className="text-sm font-semibold text-bark">{uah(it.priceUah * it.qty)}</span>
            </li>
          ))}
        </ul>
      )}

      {!empty && (
        <div className="p-4 border-t border-border space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Доставка</span>
            <span className="text-muted">розрахується далі</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-bark border-t border-border pt-2">
            <span>Усього</span>
            <span>{uah(subtotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function QtyButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 rounded-md border border-border bg-parchment text-bark active:bg-linen disabled:opacity-30"
    >
      {children}
    </button>
  );
}
