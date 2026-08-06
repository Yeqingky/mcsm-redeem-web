import * as React from "react";
import { cn } from "../../lib/utils";
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    variant?: "outlined" | "filled";
  }
>(({ className, variant = "outlined", ...p }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
      variant === "filled"
        ? "rounded-t-lg border-0 border-b border-input bg-muted focus:border-primary"
        : "rounded-md border border-input bg-background",
      className,
    )}
    {...p}
  />
));
Input.displayName = "Input";
