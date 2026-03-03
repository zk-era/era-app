/**
 * Phase 3: Amount Input
 * User enters the amount to send (USD or token units)
 * 
 * Phase 2 Updates:
 * - Uses Zustand store for amount, recipient, and token state
 * - Simplified props (state comes from store)
 */
"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownUp } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatWithCommas } from "@/lib/utils/format";
import { SendHeader } from "@/components/shared/SendHeader";
import { RecipientChip } from "@/components/shared/RecipientChip";
import { Container } from "@/components/ui/container";
import { useSendStore } from "@/lib/stores/sendStore";

interface AmountStepProps {
  onContinue: () => void;
  onBack: () => void;
}

export function AmountStep({
  onContinue,
  onBack,
}: AmountStepProps) {
  // Zustand store - direct selectors (v5 best practice)
  const recipient = useSendStore((s) => s.recipient);
  const resolvedAddress = useSendStore((s) => s.resolvedAddress);
  const selectedToken = useSendStore((s) => s.selectedToken);
  const amount = useSendStore((s) => s.amount);
  const isUsdMode = useSendStore((s) => s.isUsdMode);
  const setAmount = useSendStore((s) => s.setAmount);
  const setIsUsdMode = useSendStore((s) => s.setIsUsdMode);
  const setUsedMax = useSendStore((s) => s.setUsedMax);
  
  // Early return if no token selected (shouldn't happen but type safety)
  if (!selectedToken) {
    return null;
  }
  
  // Display logic for recipient
  const displayAddress = resolvedAddress || recipient;
  const truncatedRecipient = recipient.startsWith("0x")
    ? recipient.length > 10
      ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}`
      : recipient
    : recipient.endsWith(".eth")
      ? recipient
      : `${recipient}.eth`;
  
  // Amount calculations
  const numericAmount = parseFloat(amount) || 0;
  const tokenPrice = selectedToken.price ?? 1;
  const usdValue = isUsdMode ? numericAmount : numericAmount * tokenPrice;
  const tokenValue = isUsdMode
    ? tokenPrice > 0 ? numericAmount / tokenPrice : 0
    : numericAmount;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[0-9]*\.?[0-9]*$/.test(val) && val !== "") return;
    setAmount(val);
  };
  
  const handleToggleMode = () => {
    if (numericAmount > 0) {
      const converted = isUsdMode ? tokenValue : usdValue;
      setAmount(
        converted % 1 === 0
          ? converted.toString()
          : converted.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""),
      );
    }
    setIsUsdMode(!isUsdMode);
  };
  
  const handleUseMax = () => {
    setUsedMax(true);
    const balance = selectedToken.balance ?? 0;
    if (isUsdMode) {
      // Format USD to 2 decimals max
      const usdAmount = balance * tokenPrice;
      setAmount(usdAmount.toFixed(2));
    } else {
      // Format token amount to 6 decimals max, remove trailing zeros
      const formatted = balance.toFixed(6).replace(/\.?0+$/, "");
      setAmount(formatted);
    }
  };

  const balance = selectedToken.balance ?? 0;
  const isInsufficient = tokenValue > balance && numericAmount > 0;

  const displayValue = formatWithCommas(amount);
  const digits = (isUsdMode ? "$" + displayValue : displayValue).split("");

  return (
    <div className="flex flex-col gap-5">
      <SendHeader onBack={onBack} />

      <Container className="gap-2 rounded-[20px]">
        <span className="text-xs font-medium text-[var(--color-era-secondary)]">To</span>
        <RecipientChip 
          address={displayAddress}
          displayName={truncatedRecipient}
          size="sm"
        />
      </Container>

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
                        char === "$" && "text-[var(--color-era-secondary)]",
                        isPlaceholder && "text-[var(--color-background-elevated)]",
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
              onClick={handleToggleMode}
              className="flex items-center gap-2 text-sm text-[var(--color-era-secondary] transition-colors hover:text-white)]"
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

      <Container className="gap-3 rounded-[20px]">
        {selectedToken.logoURI ? (
          <Image
            src={selectedToken.logoURI}
            alt={selectedToken.symbol}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-background-secondary] text-sm font-semibold)]">
            {selectedToken.symbol[0]}
          </div>
        )}
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold">
            {selectedToken.name || selectedToken.symbol}
          </span>
          <p className="text-xs text-[var(--color-era-secondary)]">
            {selectedToken.balance ?? 0} {selectedToken.symbol}
          </p>
        </div>
        <button
          onClick={handleUseMax}
          className="rounded-lg bg-[var(--color-background-tertiary] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--color-background-elevated)]"
        >
          Use Max
        </button>
      </Container>

      <motion.button
        onClick={() => numericAmount > 0 && !isInsufficient && onContinue()}
        className={cn(
          "flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold transition-all",
          numericAmount > 0 && !isInsufficient
            ? "bg-white text-black hover:bg-white/90"
            : "cursor-not-allowed bg-[var(--color-background-secondary] text-[var(--color-era-tertiary)]",
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
