"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Token } from "@/lib/types/swap";

interface TokenStepProps {
  tokens: Token[];
  truncatedRecipient: string;
  onSelectToken: (token: Token) => void;
  onBack: () => void;
}

export function TokenStep({
  tokens,
  truncatedRecipient,
  onSelectToken,
  onBack,
}: TokenStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm font-medium text-[#7b7b7b] transition-colors hover:text-white"
        >
          Back
        </button>
        <h1 className="text-lg font-bold">Select Token</h1>
        <Link
          href="/"
          className="rounded-lg p-1 transition-colors hover:bg-[#1a1a1a]"
        >
          <X className="size-5 text-[#7b7b7b]" />
        </Link>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-[#1a1a1a] px-4 py-3">
        <span className="text-xs font-medium text-[#7b7b7b]">To</span>
        <span className="truncate rounded-full bg-[#2a2a2a] px-3 py-1 text-sm font-medium text-white/70">
          {truncatedRecipient}
        </span>
      </div>

      <p className="text-sm text-[#7b7b7b]">
        Which token do you want to send?
      </p>

      <div className="flex flex-col gap-3">
        {tokens.map((token) => (
          <motion.button
            key={token.symbol}
            onClick={() => onSelectToken(token)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-[#1a1a1a]"
          >
            {token.logoURI ? (
              <Image
                src={token.logoURI}
                alt={token.symbol}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-[#222] text-sm font-semibold">
                {token.symbol[0]}
              </div>
            )}
            <div className="flex-1 text-left">
              <h2 className="text-sm font-semibold">{token.name || token.symbol}</h2>
              <p className="text-xs text-[#7b7b7b]">
                {token.balance ?? 0} {token.symbol}
              </p>
            </div>
            <span className="text-sm font-semibold">
              ${((token.balance ?? 0) * (token.price ?? 1)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
