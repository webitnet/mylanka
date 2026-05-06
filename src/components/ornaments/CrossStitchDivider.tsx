import { cn } from "@/lib/utils";

/**
 * Horizontal vyshyvka-style cross-stitch divider.
 * Repeats a small motif across the available width.
 */
export function CrossStitchDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center gap-3 text-embroidery", className)}
      aria-hidden
    >
      <span className="h-px flex-1 bg-current opacity-40" />
      <svg width="160" height="14" viewBox="0 0 160 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Repeating ❖ motif: small diamond with cross-stitch satellites */}
        {[0, 32, 64, 96, 128].map((x) => (
          <g key={x} transform={`translate(${x + 16},7)`}>
            <path d="M0 -5 L4 0 L0 5 L-4 0 Z" />
            <path d="M-10 0 L-7 -3 M-10 0 L-7 3 M10 0 L7 -3 M10 0 L7 3" />
          </g>
        ))}
      </svg>
      <span className="h-px flex-1 bg-current opacity-40" />
    </div>
  );
}
