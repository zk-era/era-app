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

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, CircleCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import makeBlockie from "ethereum-blockies-base64";
import type { Token } from "@/lib/types/swap";
import { eraApi, type POCEstimate } from "@/lib/api/era";

const BATCH_SIZE_OPTIONS = [20, 50, 100] as const;
type BatchSize = (typeof BATCH_SIZE_OPTIONS)[number];

interface ConfirmStepProps {
  selectedToken: Token;
  recipient: string;
  truncatedRecipient: string;
  numericAmount: number;
  isUsdMode: boolean;
  tokenValue: number;
  usedMax: boolean;
  batchSize: BatchSize;
  onBatchSizeChange: (size: BatchSize) => void;
  onEditAmount: () => void;
  onConfirm: () => void;
}

export function ConfirmStep({
  selectedToken,
  recipient,
  truncatedRecipient,
  numericAmount,
  isUsdMode,
  tokenValue,
  usedMax,
  batchSize,
  onBatchSizeChange,
  onEditAmount,
  onConfirm,
}: ConfirmStepProps) {
  // Generate blockie for recipient (ENS names use the name as seed)
  const recipientAvatar = recipient.startsWith("0x")
    ? makeBlockie(recipient)
    : makeBlockie(recipient.toLowerCase());
  const [estimate, setEstimate] = useState<POCEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    eraApi
      .getEstimate(batchSize)
      .then((data) => {
        if (!cancelled) setEstimate(data);
      })
      .catch((err) => {
        if (!cancelled && process.env.NODE_ENV !== "production") {
          console.error(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [batchSize]);

  const totalUsd = isUsdMode
    ? numericAmount
    : numericAmount * (selectedToken.price ?? 1);

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
          <CircleCheck className="absolute -bottom-1 -right-1 size-6 fill-blue-500 text-[#131313]" />
        </div>
        <h1 className="text-2xl font-bold leading-tight">
          Confirm transaction to
          <br />
          <span className="text-white/80">{truncatedRecipient}</span>
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#7b7b7b]">Total Value</span>
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
            <span className="text-sm text-[#7b7b7b]">
              Send {selectedToken.symbol}
            </span>
            {usedMax && (
              <span className="rounded-md border border-[#505050] px-2 py-0.5 text-xs font-medium text-white/70">
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
          <span className="text-sm text-[#7b7b7b]">From</span>
          <span className="text-sm font-medium text-white/70">
            Connected Wallet
          </span>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
        {loading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="size-5 animate-spin text-white/50" />
            <span className="ml-2 text-sm text-white/50">Fetching estimates...</span>
          </div>
        ) : estimate ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#7b7b7b]">Direct L1 Transfer</span>
              <span className="font-semibold text-white/70">${estimate.directL1CostUsd}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#7b7b7b]">ERA Batched</span>
              <span className="font-semibold text-green-500">${estimate.eraCostUsd}</span>
            </div>
            <div className="border-t border-[#303030]/50 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Est. Savings</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-500">${estimate.savingsUsd}</div>
                  <div className="text-xs text-green-500/70">~{estimate.savingsPercent}% cheaper</div>
                </div>
              </div>
            </div>
            <div className="border-t border-[#303030]/50 pt-2 text-xs text-[#555]">
              Gas: {estimate.gasPriceGwei} Gwei · ETH: ${estimate.ethPriceUsd.toLocaleString()}
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-white/50">
            Unable to fetch estimates
          </div>
        )}
      </div>

      {/* Batch Size Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex w-full items-center justify-between rounded-xl bg-[#1a1a1a] px-4 py-3 text-sm transition-colors hover:bg-[#222]"
        >
          <span className="text-[#7b7b7b]">Batch Size</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{batchSize} transactions</span>
            <ChevronDown className={`size-4 text-[#7b7b7b] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </div>
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-[#303030] bg-[#1a1a1a]">
            {BATCH_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => {
                  onBatchSizeChange(size);
                  setDropdownOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-[#252525] ${
                  size === batchSize ? "bg-[#252525]" : ""
                }`}
              >
                <span>{size} transactions</span>
                {size === batchSize && (
                  <span className="text-xs text-green-500">Selected</span>
                )}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-center text-xs text-[#555]">
          Larger batches = more savings per transaction
        </p>
      </div>

      <p className="text-center text-xs leading-relaxed text-[#555]">
        Review the above before confirming.
        <br />
        Once made, your transaction is irreversible.
      </p>

      <div className="flex gap-3">
        <motion.button
          onClick={onEditAmount}
          className="flex-1 rounded-xl bg-[#1a1a1a] py-3 text-sm font-semibold transition-colors hover:bg-[#222]"
          whileTap={{ scale: 0.98 }}
        >
          Edit Amount
        </motion.button>
        <motion.button
          onClick={onConfirm}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          whileTap={{ scale: 0.98 }}
        >
          Confirm
        </motion.button>
      </div>
    </div>
  );
}
