"use client";

import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";

interface SendHeaderProps {
  onBack?: () => void;
  onClose?: () => void;
  backHref?: string;
  closeHref?: string;
}

/**
 * Shared header component for all send flow steps
 * Provides consistent navigation with back/close buttons and "Send" title
 */
export function SendHeader({
  onBack,
  onClose,
  backHref = "/",
  closeHref = "/",
}: SendHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      {onBack ? (
        <button
          onClick={onBack}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onBack();
            }
          }}
          aria-label="Go back to previous step"
          className="rounded-lg p-2 transition-colors group"
        >
          <ChevronLeft className="size-5 text-[var(--color-era-secondary)] transition-colors group-hover:text-white" />
        </button>
      ) : (
        <Link href={backHref}>
          <button 
            aria-label="Go back to home"
            className="rounded-lg p-2 transition-colors group"
          >
            <ChevronLeft className="size-5 text-[var(--color-era-secondary)] transition-colors group-hover:text-white" />
          </button>
        </Link>
      )}

      <h1 className="text-lg font-bold">Send</h1>

      {onClose ? (
        <button
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          aria-label="Close send dialog"
          className="rounded-lg p-2 transition-colors group"
        >
          <X className="size-5 text-[var(--color-era-secondary)] transition-colors group-hover:text-white" />
        </button>
      ) : (
        <Link href={closeHref}>
          <button 
            aria-label="Close and return to home"
            className="rounded-lg p-2 transition-colors group"
          >
            <X className="size-5 text-[var(--color-era-secondary)] transition-colors group-hover:text-white" />
          </button>
        </Link>
      )}
    </div>
  );
}
