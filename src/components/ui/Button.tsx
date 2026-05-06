import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center rounded-sm font-[family-name:var(--font-ui)] uppercase tracking-wider transition disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-embroidery text-parchment hover:opacity-90",
  secondary:
    "border border-bark text-bark bg-transparent hover:bg-bark hover:text-parchment",
  ghost: "text-bark hover:text-embroidery",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-[10px]",
  md: "px-5 py-2.5 text-xs",
  lg: "px-7 py-3.5 text-sm",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
