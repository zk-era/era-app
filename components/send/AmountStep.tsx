"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Token } from "@/lib/types/swap";

function formatWithCommas(value: string): string {
  if (!value) return "0";
  const parts = value.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

interface AmountStepProps {
  selectedToken: Token;
  truncatedRecipient: string;
  amount: string;
  isUsdMode: boolean;
  numericAmount: number;
  usdValue: number;
  tokenValue: number;
  onAmountChange: (value: string) => void;
  onToggleMode: () => void;
  onUseMax: () => void;
  onReview: () => void;
  onBack: () => void;
}

export function AmountStep({
  selectedToken,
  truncatedRecipient,
  amount,
  isUsdMode,
  numericAmount,
  usdValue,
  tokenValue,
  onAmountChange,
  onToggleMode,
  onUseMax,
  onReview,
  onBack,
}: AmountStepProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[0-9]*\.?[0-9]*$/.test(val) && val !== "") return;
    onAmountChange(val);
  };

  const balance = selectedToken.balance ?? 0;
  const isInsufficient = tokenValue > balance && numericAmount > 0;

  const displayValue = formatWithCommas(amount);
  const digits = (isUsdMode ? "$" + displayValue : displayValue).split("");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm font-medium text-[#7b7b7b] transition-colors hover:text-white"
        >
          Back
        </button>
        <h1 className="text-lg font-bold">Send {selectedToken.symbol}</h1>
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

      <div className="flex flex-col items-center gap-3 py-8">
        <div className="relative w-full overflow-hidden text-center">
          <input
            type="text"
            placeholder="0"
            value={amount}
            onChange={handleInputChange}
            className="w-full bg-transparent text-center text-[56px] font-bold tracking-tight text-transparent caret-transparent outline-none"
            autoFocus
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence initial={false} mode="popLayout">
              {(amount ? digits : [isUsdMode ? "$" : "", "0"].filter(Boolean)).map(
                (char, index) => {
                  const isPlaceholder = !amount && char === "0";
                  return (
                    <motion.span
                      key={`${char}-${index}`}
                      className={cn(
                        "text-[56px] font-bold tracking-tight",
                        char === "$" && "text-[#7b7b7b]",
                        isPlaceholder && "text-[#333]",
                      )}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "100%", opacity: 0 }}
                    >
                      {char}
                    </motion.span>
                  );
                },
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {isInsufficient ? (
            <motion.p
              key="insufficient"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: [0, -5, 5, -3, 3, 0],
                transition: {
                  x: { delay: 0.2, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                },
              }}
              exit={{ opacity: 0, scale: 0 }}
              className="text-sm font-semibold text-red-500"
            >
              Not Enough {selectedToken.symbol}
            </motion.p>
          ) : (
            <motion.button
              key="toggle"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={onToggleMode}
              className="flex items-center gap-2 text-sm text-[#7b7b7b] transition-colors hover:text-white"
            >
              {isUsdMode ? (
                <>
                  {selectedToken.logoURI && (
                    <Image
                      src={selectedToken.logoURI}
                      alt={selectedToken.symbol}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  )}
                  <NumberFlow value={tokenValue} />
                </>
              ) : (
                <>
                  <span>$</span>
                  <NumberFlow value={usdValue} />
                </>
              )}
              <ArrowDownUp className="size-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-[#1a1a1a] px-4 py-3">
        {selectedToken.logoURI ? (
          <Image
            src={selectedToken.logoURI}
            alt={selectedToken.symbol}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-[#222] text-sm font-semibold">
            {selectedToken.symbol[0]}
          </div>
        )}
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold">
            {selectedToken.name || selectedToken.symbol}
          </span>
          <p className="text-xs text-[#7b7b7b]">
            {selectedToken.balance ?? 0} {selectedToken.symbol}
          </p>
        </div>
        <button
          onClick={onUseMax}
          className="rounded-lg bg-[#2a2a2a] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#333]"
        >
          Use Max
        </button>
      </div>

      <motion.button
        onClick={() => numericAmount > 0 && !isInsufficient && onReview()}
        className={cn(
          "flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all",
          numericAmount > 0 && !isInsufficient
            ? "bg-white text-black hover:bg-white/90"
            : "cursor-not-allowed bg-[#1a1a1a] text-[#555]",
        )}
        whileTap={numericAmount > 0 && !isInsufficient ? { scale: 0.98 } : {}}
      >
        {isInsufficient
          ? `Not Enough ${selectedToken.symbol}`
          : numericAmount > 0
            ? "Review"
            : "Enter amount"}
      </motion.button>
    </div>
  );
}
