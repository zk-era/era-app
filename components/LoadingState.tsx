/**
 * Standardized Loading State Component
 * 
 * Provides consistent loading UX across all send flow steps.
 * Supports multiple variants for different loading contexts.
 */

import { Container } from "@/components/ui/container";
import { PulsatingLoader } from "@/components/PulsatingLoader";

interface LoadingStateProps {
  /** Loading variant */
  variant?: "spinner" | "skeleton" | "pulsating";
  /** Optional message to display */
  message?: string;
  /** Size of the loader */
  size?: "sm" | "md" | "lg";
  /** Color for pulsating loader */
  color?: string;
}

/**
 * Standard spinner loader
 */
function SpinnerLoader({ size = "md" }: { size: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  return (
    <svg 
      className={`${sizeClasses[size]} animate-spin`}
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Skeleton loader for placeholders
 */
function SkeletonLoader({ size = "md" }: { size: "sm" | "md" | "lg" }) {
  const heights = {
    sm: "h-3",
    md: "h-4",
    lg: "h-5",
  };

  return (
    <div className={`${heights[size]} w-24 animate-pulse rounded bg-[var(--color-background-secondary)]`} />
  );
}

/**
 * Standardized loading state component
 */
export function LoadingState({ 
  variant = "spinner", 
  message,
  size = "md",
  color = "#8b5cf6" // Default violet
}: LoadingStateProps) {
  if (variant === "pulsating") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8">
        <PulsatingLoader color={color} />
        {message && (
          <p className="text-sm text-[var(--color-era-secondary)]">{message}</p>
        )}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonLoader size={size} />
        {message && (
          <p className="text-sm text-[var(--color-era-secondary)]">{message}</p>
        )}
      </div>
    );
  }

  // Default: spinner
  return (
    <Container rounded="lg" padding="lg" className="justify-center">
      <div className="flex items-center gap-3">
        <SpinnerLoader size={size} />
        {message && (
          <p className="text-sm text-[var(--color-era-secondary)]">{message}</p>
        )}
      </div>
    </Container>
  );
}

/**
 * Inline loading state for small spaces (e.g., next to inputs)
 */
export function InlineLoader({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div className="flex size-7 shrink-0 items-center justify-center">
      <SpinnerLoader size={size} />
    </div>
  );
}
