import { cn } from "@/lib/utils";

/**
 * Small filled diamond used as a separator between brand-tagline words:
 *   Вишиванки ◆ Сувеніри ◆ Обереги
 */
export function Diamond({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block align-middle text-embroidery", className)}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
        <path d="M4 0 L8 4 L4 8 L0 4 Z" />
      </svg>
    </span>
  );
}
