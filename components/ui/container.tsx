import { HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva("flex items-center", {
  variants: {
    bg: {
      primary: "bg-[var(--color-background)]",
      secondary: "bg-[var(--color-background-secondary)]",
      tertiary: "bg-[var(--color-background-tertiary)]",
      elevated: "bg-[var(--color-background-elevated)]",
    },
    padding: {
      none: "",
      sm: "px-3 py-2",
      md: "px-4 py-3",
      lg: "px-6 py-4",
    },
    rounded: {
      sm: "rounded-[var(--radius-era-sm)]",
      md: "rounded-[var(--radius-era-md)]",
      lg: "rounded-[var(--radius-era-lg)]",
      xl: "rounded-[var(--radius-era-xl)]",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    bg: "secondary",
    padding: "md",
    rounded: "lg",
  },
});

export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, bg, padding, rounded, ...props }, ref) => {
    return (
      <div
        className={cn(containerVariants({ bg, padding, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";

export { Container, containerVariants };
