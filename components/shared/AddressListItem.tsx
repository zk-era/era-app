/**
 * AddressListItem Component
 * 
 * Shared component for displaying Ethereum addresses with blockies avatars.
 * Used in both search results and recent sends lists for consistent UX.
 * 
 * Features:
 * - Consistent avatar size (40x40)
 * - Two-line layout (primary + secondary text)
 * - Loading state support (for ENS resolution)
 * - Hover states
 */

"use client";

import makeBlockie from "ethereum-blockies-base64";

interface AddressListItemProps {
  /** Ethereum address for blockie generation */
  address: string;
  /** Display name (ENS or truncated address) */
  displayName: string;
  /** Secondary label (e.g., "Ethereum Address" or resolved address) */
  secondaryLabel: string | React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Optional: Show loading skeleton for secondary label */
  isLoading?: boolean;
}

export function AddressListItem({
  address,
  displayName,
  secondaryLabel,
  onClick,
  isLoading = false,
}: AddressListItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-background-secondary)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={makeBlockie(address)}
        alt=""
        width={40}
        height={40}
        className="rounded-full"
      />
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-semibold text-white">
          {displayName}
        </p>
        {isLoading ? (
          <div className="h-3 w-24 animate-pulse rounded bg-[var(--color-background-secondary)]" />
        ) : (
          <p className="truncate text-xs text-[var(--color-era-secondary)]">
            {secondaryLabel}
          </p>
        )}
      </div>
    </button>
  );
}
