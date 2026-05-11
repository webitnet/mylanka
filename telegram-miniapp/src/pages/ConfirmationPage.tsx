import { useMainButton } from "@/lib/mainButton";
import { getWebApp } from "@/lib/telegram";

export function ConfirmationPage({
  orderNumber,
  onClose,
}: {
  orderNumber: string;
  onClose: () => void;
}) {
  useMainButton({
    text: "До каталогу",
    onClick: onClose,
  });

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center py-16">
      <div className="text-5xl mb-4">🎉</div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-brass">Замовлення прийнято</p>
      <h1 className="mt-2 text-2xl font-semibold text-bark">{orderNumber}</h1>
      <p className="mt-4 text-sm text-muted max-w-sm">
        Дякуємо! Найближчим часом ми зв'яжемось для підтвердження. Статус замовлення
        приходитиме в чат бота.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            getWebApp()?.close();
          } catch {
            /* ignore */
          }
        }}
        className="mt-6 text-[11px] uppercase tracking-wider text-muted hover:text-bark"
      >
        Закрити Mini App
      </button>
    </div>
  );
}
