import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium transition-[color,background-color,border-color,transform,filter,box-shadow] duration-150 active:translate-y-px active:scale-[0.97] active:brightness-90 active:shadow-inner motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent",
      },
      size: { default: "h-10 px-4 py-2", sm: "h-9 px-3" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...p }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...p}
    />
  ),
);
Button.displayName = "Button";
