import { useLocale } from "next-intl";
import { cn, formatUah } from "@/lib/utils";

export function Price({
  amount,
  comparePrice,
  className,
}: {
  amount: number;
  comparePrice?: number | null;
  className?: string;
}) {
  const locale = useLocale();
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-[family-name:var(--font-display)] text-lg text-bark">
        {formatUah(amount, locale)}
      </span>
      {comparePrice && comparePrice > amount && (
        <span className="text-xs text-muted line-through">
          {formatUah(comparePrice, locale)}
        </span>
      )}
    </span>
  );
}
