"use client";

/**
 * Rich Result Toast Content
 *
 * Displays transaction result in a card format matching Rainbow wallet design.
 * Used as custom content inside Sileo toast.
 */

import { Send, Check, Info, Wallet, Fuel, Link } from "lucide-react";
import makeBlockie from "ethereum-blockies-base64";
import { formatGasUsd } from "@/lib/utils/format";

interface ResultToastProps {
  tokenSymbol: string;
  tokenLogo?: string;
  amount: string;
  usdValue: string;
  recipient: string;
  sender: string;
  networkFee: string;
  chainName: string;
  chainIcon?: string;
}

export function ResultToast({
  tokenSymbol,
  tokenLogo,
  amount,
  usdValue,
  recipient,
  sender,
  networkFee,
  chainName,
  chainIcon,
}: ResultToastProps) {
  const truncatedRecipient = recipient.endsWith(".eth")
    ? recipient
    : `${recipient.slice(0, 6)}····${recipient.slice(-4)}`;

  const truncatedSender = `${sender.slice(0, 6)}····${sender.slice(-4)}`;
  const senderBlockie = makeBlockie(sender);

  const timestamp = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex w-full flex-col gap-3 pt-1">
      {/* Header - Token & Recipient */}
      <div className="flex items-center gap-3">
        <div className="relative">
          {tokenLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tokenLogo}
              alt={tokenSymbol}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-[#333] text-sm font-bold">
              {tokenSymbol.slice(0, 2)}
            </div>
          )}
          <div className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#3b82f6] ring-2 ring-[#1a1a1a]">
            <Send className="size-2.5 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Sent to {truncatedRecipient}</p>
          <p className="text-xs text-[#7b7b7b]">{timestamp}</p>
        </div>
      </div>

      {/* Amount Card */}
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-[#303030] px-4 py-5">
        <p className="text-3xl font-bold text-white">${usdValue}</p>
        <div className="flex items-center gap-1.5">
          {tokenLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tokenLogo}
              alt={tokenSymbol}
              width={16}
              height={16}
              className="rounded-full"
            />
          ) : (
            <div className="flex size-4 items-center justify-center rounded-full bg-[#333] text-[8px] font-bold">
              {tokenSymbol.slice(0, 2)}
            </div>
          )}
          <p className="text-sm font-medium text-[#3b82f6]">{amount} {tokenSymbol}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between rounded-full bg-[#164e63]/40 px-4 py-2">
        <div className="flex size-4 items-center justify-center rounded-full bg-[#22d3ee]">
          <Check className="size-2.5 text-white" strokeWidth={3} />
        </div>
        <span className="text-sm font-semibold text-[#22d3ee]">Completed</span>
        <Info className="size-4 text-[#22d3ee]" />
      </div>

      {/* Details */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7b7b7b]">
            <Wallet className="size-4" />
            <span className="text-sm">Sending Wallet</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={senderBlockie}
              alt=""
              width={16}
              height={16}
              className="rounded-full"
            />
            <span className="text-sm font-medium text-white">{truncatedSender}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7b7b7b]">
            <Fuel className="size-4" />
            <span className="text-sm">Network Fee</span>
          </div>
          <span className="text-sm font-medium text-white">{formatGasUsd(networkFee)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7b7b7b]">
            <Link className="size-4" />
            <span className="text-sm">Chain</span>
          </div>
          <div className="flex items-center gap-1.5">
            {chainIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={chainIcon}
                alt={chainName}
                width={16}
                height={16}
                className="rounded-full"
              />
            ) : (
              <div className="size-4 rounded-full bg-[#627eea]" />
            )}
            <span className="text-sm font-medium text-white">{chainName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
