/**
 * Rich Result Toast Content for Swaps
 *
 * Displays swap result in a card format matching Rainbow wallet design.
 * Used as custom content inside Sileo toast.
 * Matches send/ResultToast.tsx architecture
 */
"use client";

import { ArrowDownUp, Check, Info, Wallet, Fuel, Link } from "lucide-react";
import makeBlockie from "ethereum-blockies-base64";
import { formatGasUsd } from "@/lib/utils/format";

interface ResultToastProps {
  tokenInSymbol: string;
  tokenInLogo?: string;
  tokenOutSymbol: string;
  tokenOutLogo?: string;
  amountIn: string;
  amountOut: string;
  usdValue: string;
  sender: string;
  networkFee: string;
  chainName: string;
  chainIcon?: string;
  savingsPercent: number;
}

export function ResultToast({
  tokenInSymbol,
  tokenInLogo,
  tokenOutSymbol,
  tokenOutLogo,
  amountIn,
  amountOut,
  usdValue,
  sender,
  networkFee,
  chainName,
  chainIcon,
  savingsPercent,
}: ResultToastProps) {
  const truncatedSender = `${sender.slice(0, 6)}····${sender.slice(-4)}`;
  const senderBlockie = makeBlockie(sender);

  const timestamp =
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="flex w-full flex-col gap-3 pt-1">
      {/* Header - Swap Tokens */}
      <div className="flex items-center gap-3">
        <div className="relative">
          {tokenInLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tokenInLogo}
              alt={tokenInSymbol}
              width={40}
              height={40}
              className="rounded-full"
              aria-hidden="true"
            />
          ) : (
            <div
              className="flex size-10 items-center justify-center rounded-full bg-[#333] text-sm font-bold"
              aria-hidden="true"
            >
              {tokenInSymbol.slice(0, 2)}
            </div>
          )}
          <div className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#8b5cf6] ring-2 ring-[#1a1a1a]">
            <ArrowDownUp className="size-2.5 text-white" aria-hidden="true" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            Swapped {tokenInSymbol} → {tokenOutSymbol}
          </p>
          <p className="text-xs text-[#7b7b7b]">{timestamp}</p>
        </div>
      </div>

      {/* Amount Card */}
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-[#303030] px-4 py-5">
        <p className="text-3xl font-bold text-white">${usdValue}</p>
        <div className="flex items-center gap-1.5">
          {tokenInLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tokenInLogo}
              alt={tokenInSymbol}
              width={16}
              height={16}
              className="rounded-full"
              aria-hidden="true"
            />
          ) : (
            <div
              className="flex size-4 items-center justify-center rounded-full bg-[#333] text-[8px] font-bold"
              aria-hidden="true"
            >
              {tokenInSymbol.slice(0, 2)}
            </div>
          )}
          <p className="text-sm font-medium text-[#8b5cf6]">
            {amountIn} {tokenInSymbol}
          </p>
          <ArrowDownUp className="size-3 text-[#7b7b7b]" aria-hidden="true" />
          {tokenOutLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tokenOutLogo}
              alt={tokenOutSymbol}
              width={16}
              height={16}
              className="rounded-full"
              aria-hidden="true"
            />
          ) : (
            <div
              className="flex size-4 items-center justify-center rounded-full bg-[#333] text-[8px] font-bold"
              aria-hidden="true"
            >
              {tokenOutSymbol.slice(0, 2)}
            </div>
          )}
          <p className="text-sm font-medium text-[#8b5cf6]">
            {amountOut} {tokenOutSymbol}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between rounded-full bg-[#164e63]/40 px-4 py-2">
        <div className="flex size-4 items-center justify-center rounded-full bg-[#22d3ee]">
          <Check className="size-2.5 text-white" strokeWidth={3} aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold text-[#22d3ee]">Completed</span>
        <Info className="size-4 text-[#22d3ee]" aria-hidden="true" />
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7b7b7b]">
            <Wallet className="size-4" aria-hidden="true" />
            <span className="text-sm">Swapping Wallet</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={senderBlockie}
              alt=""
              width={16}
              height={16}
              className="rounded-full"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-white">{truncatedSender}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7b7b7b]">
            <Fuel className="size-4" aria-hidden="true" />
            <span className="text-sm">Network Fee</span>
          </div>
          <span className="text-sm font-medium text-white">{formatGasUsd(networkFee)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7b7b7b]">
            <Info className="size-4" aria-hidden="true" />
            <span className="text-sm">Gas Savings</span>
          </div>
          <span className="text-sm font-medium text-green-400">{savingsPercent.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7b7b7b]">
            <Link className="size-4" aria-hidden="true" />
            <span className="text-sm">Chain</span>
          </div>
          <div className="flex items-center gap-1.5">
            {chainIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={chainIcon} alt="" width={16} height={16} className="rounded-full" aria-hidden="true" />
            ) : (
              <div className="size-4 rounded-full bg-[#627eea]" aria-hidden="true" />
            )}
            <span className="text-sm font-medium text-white">{chainName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
