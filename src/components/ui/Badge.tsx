import { cn } from "@/lib/utils";

type Variant = "default" | "new" | "sale" | "featured";

const variants: Record<Variant, string> = {
  default: "bg-wheat text-bark",
  new: "bg-sage text-cream",
  sale: "bg-terracotta text-cream",
  featured: "bg-gold text-bark",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
