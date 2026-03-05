import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-white text-black hover:bg-white/90 rounded-[var(--radius-era-lg)]",
        secondary: "bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-tertiary)] rounded-[var(--radius-era-lg)]",
        ghost: "hover:bg-[var(--color-background-secondary)] rounded-[var(--radius-era-lg)]",
        icon: "rounded-lg p-1 hover:bg-[var(--color-background-secondary)]",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-3 text-sm",
        lg: "px-6 py-4 text-base",
        icon: "size-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
