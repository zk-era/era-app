"use client";

import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import makeBlockie from "ethereum-blockies-base64";
import { cn } from "@/lib/utils";
import type { RecentSend } from "@/lib/hooks/useRecentSends";

interface AddressStepProps {
  recipient: string;
  onRecipientChange: (value: string) => void;
  isValidAddress: boolean;
  onContinue: () => void;
  recentSends: RecentSend[];
}

export function AddressStep({
  recipient,
  onRecipientChange,
  isValidAddress,
  onContinue,
  recentSends,
}: AddressStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = () => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    navigator.clipboard.readText().then((text) => {
      if (text) onRecipientChange(text.trim());
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Send</h1>
        <Link
          href="/"
          className="rounded-lg p-1 transition-colors hover:bg-[#1a1a1a]"
        >
          <X className="size-5 text-[#7b7b7b]" />
        </Link>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-[#1a1a1a] px-4 py-3">
        <span className="text-xs font-medium text-[#7b7b7b]">To</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="ENS or Address"
          value={recipient}
          onChange={(e) => onRecipientChange(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text").trim();
            onRecipientChange(text);
          }}
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-medium placeholder:text-[#555]"
          autoFocus
        />
        <button
          onClick={handlePaste}
          className="rounded-lg bg-[#2a2a2a] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#333]"
        >
          Paste
        </button>
      </div>

      {recentSends.length > 0 && !recipient && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-[#7b7b7b]">Recent</span>
          <div className="flex flex-col gap-1">
            {recentSends.map((recent) => (
              <button
                key={recent.address}
                onClick={() => onRecipientChange(recent.ensName || recent.address)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#1a1a1a]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={makeBlockie(recent.address)}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="flex-1 overflow-hidden">
                  {recent.ensName ? (
                    <>
                      <p className="truncate text-sm font-medium">{recent.ensName}</p>
                      <p className="truncate text-xs text-[#7b7b7b]">
                        {recent.address.slice(0, 6)}...{recent.address.slice(-4)}
                      </p>
                    </>
                  ) : (
                    <p className="truncate text-sm font-medium">
                      {recent.address.slice(0, 6)}...{recent.address.slice(-4)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <motion.button
        onClick={() => isValidAddress && onContinue()}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
          isValidAddress
            ? "bg-white text-black hover:bg-white/90"
            : "cursor-not-allowed bg-[#1a1a1a] text-[#555]",
        )}
        whileTap={isValidAddress ? { scale: 0.98 } : {}}
      >
        Continue
        {isValidAddress && <ArrowRight className="size-4" />}
      </motion.button>
    </div>
  );
}
