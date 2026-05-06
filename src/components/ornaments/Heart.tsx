import { cn } from "@/lib/utils";

export function Heart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      className={cn("inline-block fill-current", className)}
      aria-hidden
    >
      <path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4 2.5 6 2.5c1.2 0 2 .7 2 1.5 0-.8.8-1.5 2-1.5 2 0 3.5 1.5 3.5 4C13.5 10.5 8 14 8 14z" />
    </svg>
  );
}
