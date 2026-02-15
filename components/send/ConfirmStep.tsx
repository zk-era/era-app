"use client";

import { motion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import Image from "next/image";
import type { Token } from "@/lib/types/swap";

interface ConfirmStepProps {
  selectedToken: Token;
  truncatedRecipient: string;
  numericAmount: number;
  isUsdMode: boolean;
  tokenValue: number;
  usedMax: boolean;
  onEditAmount: () => void;
  onConfirm: () => void;
}

export function ConfirmStep({
  selectedToken,
  truncatedRecipient,
  numericAmount,
  isUsdMode,
  tokenValue,
  usedMax,
  onEditAmount,
  onConfirm,
}: ConfirmStepProps) {
  const totalUsd = isUsdMode
    ? numericAmount
    : numericAmount * (selectedToken.price ?? 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="relative size-16">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#1a1a1a] text-2xl font-bold">
            {truncatedRecipient[0]?.toUpperCase() || "?"}
          </div>
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#7b7b7b]">Direct L1 Gas</span>
          <span className="font-semibold text-white/70">$5.20</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#7b7b7b]">ERA Gas</span>
          <span className="font-semibold text-green-500">$0.10</span>
        </div>
        <div className="border-t border-[#303030]/50 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">You Save</span>
            <div className="text-right">
              <div className="text-sm font-bold text-green-500">$5.10</div>
              <div className="text-xs text-green-500/70">98.1% cheaper</div>
            </div>
          </div>
        </div>
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
