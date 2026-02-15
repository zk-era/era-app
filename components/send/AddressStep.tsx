"use client";

import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface AddressStepProps {
  recipient: string;
  onRecipientChange: (value: string) => void;
  isValidAddress: boolean;
  onContinue: () => void;
}

export function AddressStep({
  recipient,
  onRecipientChange,
  isValidAddress,
  onContinue,
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
