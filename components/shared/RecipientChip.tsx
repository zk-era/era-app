"use client";

import makeBlockie from "ethereum-blockies-base64";

interface RecipientChipProps {
  address: string; // For blockie generation
  displayName: string; // ENS or truncated address
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable recipient display chip with blockie avatar
 * Used across TokenStep, AmountStep, and other send flow components
 */
export function RecipientChip({
  address,
  displayName,
  size = "md",
}: RecipientChipProps) {
  const blockie = makeBlockie(address);

  const avatarSize = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  return (
    <span className="flex items-center gap-2 truncate rounded-full bg-[var(--color-background-tertiary)] pl-1.5 pr-3 py-1 text-sm font-medium text-white/70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={blockie}
        alt=""
        width={avatarSize}
        height={avatarSize}
        className="rounded-full"
      />
      {displayName}
    </span>
  );
}
