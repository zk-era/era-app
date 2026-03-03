"use client";

/**
 * Recipient Avatar Strategy:
 * Currently using Ethereum blockies for recipient address visualization.
 * Blockies are deterministic - same address always generates the same pattern,
 * which helps users visually verify addresses.
 *
 * TODO: Add ENS avatar fetching for recipients with ENS names.
 * This would require calling an ENS resolver to fetch the avatar URL
 * for addresses that have an ENS name set.
 */

/**
 * Phase 4: Transaction Confirmation
 * User reviews details, selects batch size, and confirms the transaction
 * 
 * Phase 2 Updates:
 * - Uses Zustand store for all send flow state
 * - Simplified props (all state comes from store)
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAccount } from "wagmi";
import makeBlockie from "ethereum-blockies-base64";
import { eraApi, type POCEstimate } from "@/lib/api/era";
import { formatGasUsd } from "@/lib/utils/format";
import { useSendStore } from "@/lib/stores/sendStore";

const BATCH_SIZE_OPTIONS = [20, 50, 100] as const;

interface ConfirmStepProps {
  isProcessing?: boolean;
  onEditAmount: () => void;
  onConfirm: () => void;
}

export function ConfirmStep({
  isProcessing = false,
  onEditAmount,
  onConfirm,
}: ConfirmStepProps) {
  const { address: userAddress } = useAccount();
  
  // Zustand store - direct selectors (v5 best practice)
  const recipient = useSendStore((s) => s.recipient);
  const resolvedAddress = useSendStore((s) => s.resolvedAddress);
  const selectedToken = useSendStore((s) => s.selectedToken);
  const amount = useSendStore((s) => s.amount);
  const isUsdMode = useSendStore((s) => s.isUsdMode);
  const usedMax = useSendStore((s) => s.usedMax);
  const batchSize = useSendStore((s) => s.batchSize);
  const setBatchSize = useSendStore((s) => s.setBatchSize);
  
  // React Hooks MUST be called before any early returns
  const [estimate, setEstimate] = useState<POCEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    eraApi
      .getEstimate(batchSize)
      .then((data) => {
        if (!cancelled) {
          setEstimate(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("ERA Estimate Error:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [batchSize]);
  
  // Early return AFTER all hooks (Rules of Hooks compliance)
  if (!selectedToken) {
    return null;
  }
  
  // Display logic for recipient
  const displayAddress = resolvedAddress || recipient;
  
  // Display name for heading (ENS or truncated address)
  const displayName = recipient.startsWith("0x")
    ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}`
    : recipient.endsWith(".eth")
      ? recipient
      : `${recipient}.eth`;
  
  // Amount calculations
  const numericAmount = parseFloat(amount) || 0;
  const tokenPrice = selectedToken.price ?? 1;
  const tokenValue = isUsdMode
    ? tokenPrice > 0 ? numericAmount / tokenPrice : 0
    : numericAmount;
  
  // Generate blockies
  const recipientAvatar = makeBlockie(displayAddress);
  const userAvatar = userAddress ? makeBlockie(userAddress) : null;
  const truncatedUserAddress = userAddress 
    ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
    : "Connected Wallet";

  const totalUsd = isUsdMode ? numericAmount : numericAmount * tokenPrice;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="relative size-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipientAvatar}
            alt="Recipient"
            width={64}
            height={64}
            className="rounded-full"
          />
          {/* Custom verification badge with circular background ring */}
          <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--color-background)] p-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/verify.svg"
              alt="Verified"
              width={20}
              height={20}
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold leading-tight">
          Confirm transaction to {displayName}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">Total Value</span>
          <span className="text-base font-semibold">
            $
            {totalUsd.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-era-secondary)]">
              Send {selectedToken.symbol}
            </span>
            {usedMax && (
              <span className="rounded-md border border-[var(--color-border-hover] px-2 py-0.5 text-xs font-medium text-white/70)]">
                Max
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedToken.logoURI && (
              <Image
                src={selectedToken.logoURI}
                alt={selectedToken.symbol}
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <span className="text-base font-semibold">
              {tokenValue.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 6,
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">From</span>
          <div className="flex items-center gap-2">
            {userAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt="Your wallet"
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <span className="text-sm font-medium text-white/70">
              {truncatedUserAddress}
            </span>
          </div>
        </div>
        
        {/* Dotted separator */}
        <div className="border-t border-dashed border-[var(--color-border)]" />

        {/* Batch Size Selector */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">Batch Size</span>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-background-secondary] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-background-tertiary)]"
            >
              <span className="font-medium text-white/70">{batchSize}</span>
              <ChevronDown className={`size-3.5 text-[var(--color-era-secondary)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[80px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background-secondary)]">
                {BATCH_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setBatchSize(size);
                      setDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-center px-4 py-2 text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
                      size === batchSize ? "bg-[var(--color-background-tertiary)] text-white font-medium" : "text-white/70"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fee Estimate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">Fee estimate</span>
          {loading ? (
            <Loader2 className="size-4 animate-spin text-white/50" />
          ) : estimate ? (
            <span className="text-sm font-medium text-white/70">
              {formatGasUsd(estimate.eraCostUsd)}
            </span>
          ) : (
            <span className="text-sm text-white/50">—</span>
          )}
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-[var(--color-era-tertiary)]">
        Review the above before confirming.
        <br />
        Once made, your transaction is irreversible.
      </p>

      <div className="flex gap-3">
        <motion.button
          onClick={onEditAmount}
          disabled={isProcessing}
          className="flex-1 rounded-[20px] bg-[var(--color-background-secondary)] py-3 text-sm font-semibold transition-colors hover:bg-[var(--color-background-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
          whileTap={isProcessing ? {} : { scale: 0.98 }}
        >
          Edit Amount
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          whileTap={isProcessing ? {} : { scale: 0.98 }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Processing
            </>
          ) : (
            "Confirm"
          )}
        </motion.button>
      </div>
    </div>
  );
}
