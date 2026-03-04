/**
 * Swap Header Component
 * 
 * Reusable header for swap flow steps (matches SendHeader.tsx pattern)
 * Handles back navigation and close actions
 */
"use client";

import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";

interface SwapHeaderProps {
  onBack?: () => void;
  backHref?: string;
  onClose?: () => void;
  closeHref?: string;
  title?: string;
}

export function SwapHeader({
  onBack,
  backHref = "/",
  onClose,
  closeHref = "/",
  title = "Swap",
}: SwapHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Back Button */}
      {onBack ? (
        <button
          onClick={onBack}
          className="rounded-lg p-1 transition-colors hover:bg-[#1a1a1a]"
          aria-label="Go back to previous step"
        >
          <ChevronLeft className="size-5 text-[#7b7b7b]" aria-hidden="true" />
        </button>
      ) : (
        <Link
          href={backHref}
          className="rounded-lg p-1 transition-colors hover:bg-[#1a1a1a]"
          aria-label="Go back to home"
        >
          <ChevronLeft className="size-5 text-[#7b7b7b]" aria-hidden="true" />
        </Link>
      )}

      {/* Title */}
      <h1 className="text-lg font-bold">{title}</h1>

      {/* Close Button */}
      {onClose ? (
        <button
          onClick={onClose}
          className="rounded-lg p-1 transition-colors hover:bg-[#1a1a1a]"
          aria-label="Close swap flow"
        >
          <X className="size-5 text-[#7b7b7b]" aria-hidden="true" />
        </button>
      ) : (
        <Link
          href={closeHref}
          className="rounded-lg p-1 transition-colors hover:bg-[#1a1a1a]"
          aria-label="Close and return to home"
        >
          <X className="size-5 text-[#7b7b7b]" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
