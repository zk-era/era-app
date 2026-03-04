/**
 * Phase 2: Amount Input
 * User enters the swap amount
 * 
 * Matches send flow architecture:
 * - Uses Zustand store for state management
 * - Animated digit input with NumberFlow
 * - Real-time quote fetching
 * - Balance validation
 */
"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "framer-motion";
import { Equal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { SwapHeader } from "@/components/shared/SwapHeader";
import { Container } from "@/components/ui/container";
import { useSwapStore } from "@/lib/stores/swapStore";
import { useSwapQuote } from "@/lib/hooks/useSwapQuote";
import { cn } from "@/lib/utils";

interface AmountStepProps {
  onBack: () => void;
  onContinue: () => void;
}

export function AmountStep({ onBack, onContinue }: AmountStepProps) {
  // Zustand store
  const tokenIn = useSwapStore((s) => s.tokenIn);
  const tokenOut = useSwapStore((s) => s.tokenOut);
  const amountIn = useSwapStore((s) => s.amountIn);
  const setAmountIn = useSwapStore((s) => s.setAmountIn);
  const setAmountOut = useSwapStore((s) => s.setAmountOut);
  const usedMax = useSwapStore((s) => s.usedMax);
  const setUsedMax = useSwapStore((s) => s.setUsedMax);

  // Local state for input
  const [inputValue, setInputValue] = useState(amountIn);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ref, bounds] = useMeasure();
  const [ref2, bounds2] = useMeasure();

  // Parse numeric value
  const value = parseFloat(inputValue) || 0;

  // Token balance and price
  const tokenInBalance = tokenIn?.balance ?? 0;
  const tokenInPrice = tokenIn?.price ?? 1;
  const usdValue = value * tokenInPrice;

  // Get real-time quote
  const { comparison, isLoading } = useSwapQuote({
    tokenIn: tokenIn
      ? {
          address: tokenIn.address,
          decimals: tokenIn.decimals,
        }
      : { address: "", decimals: 18 },
    tokenOut: tokenOut
      ? {
          address: tokenOut.address,
          decimals: tokenOut.decimals,
        }
      : { address: "", decimals: 18 },
    amount: inputValue || "0",
    walletAddress: "0x742d35cc6634c0532925a3b844bc454e4438f44e", // Mock
    enabled: value > 0 && !!tokenIn && !!tokenOut,
  });

  // Calculate output amount
  const tokenOutReceive =
    value > 0 && comparison ? parseFloat(comparison.uniswap.outputAmount) : 0;

  // Update store when quote changes (useEffect to avoid render loop)
  useEffect(() => {
    if (tokenOutReceive > 0) {
      setAmountOut(tokenOutReceive);
    }
  }, [tokenOutReceive, setAmountOut]);

  // Check if insufficient balance
  const isInsufficient = value > tokenInBalance;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // Only allow numbers and decimal point
    if (!/^[0-9]*\.?[0-9]*$/.test(inputVal) && inputVal !== "") {
      return;
    }

    // Handle empty or decimal-only input
    if (inputVal === "" || inputVal === ".") {
      setInputValue(inputVal);
      setAmountIn("");
      setUsedMax(false);
      return;
    }

    // Handle numbers starting with decimal
    if (inputVal.startsWith(".")) {
      setInputValue(inputVal);
      setAmountIn(inputVal);
      setUsedMax(false);
      return;
    }

    const newValue = parseFloat(inputVal) || 0;
    const maxValue = 1000000; // 1 million max

    if (newValue > maxValue) {
      setInputValue(maxValue.toString());
      setAmountIn(maxValue.toString());
      return;
    }

    setInputValue(inputVal);
    setAmountIn(inputVal);
    setUsedMax(false);
  };

  // Handle Use Max
  const handleUseMax = () => {
    if (tokenInBalance > 0) {
      const maxAmount = tokenInBalance.toString();
      setInputValue(maxAmount);
      setAmountIn(maxAmount);
      setUsedMax(true);
      inputRef.current?.focus();
    }
  };

  // Handle Clear
  const handleClear = () => {
    setInputValue("");
    setAmountIn("");
    setUsedMax(false);
    inputRef.current?.focus();
  };

  // Format display value
  const displayValue = inputValue || "0";
  const digits = displayValue.split("");

  // Check if can continue
  const canContinue = value > 0 && !isInsufficient && tokenOutReceive > 0;

  if (!tokenIn || !tokenOut) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      <SwapHeader onBack={onBack} title="Swap" />

      {/* Token In Display */}
      <Container className="gap-2 rounded-[20px]">
        <span className="text-xs font-medium text-[var(--color-era-secondary)]">
          You Pay
        </span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tokenIn.logoURI ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokenIn.logoURI}
                alt={tokenIn.symbol}
                className="size-8 rounded-full"
                aria-hidden="true"
              />
            ) : (
              <div
                className="flex size-8 items-center justify-center rounded-full bg-[#333] text-xs font-bold"
                aria-hidden="true"
              >
                {tokenIn.symbol.slice(0, 2)}
              </div>
            )}
            <span className="font-medium">{tokenIn.symbol}</span>
          </div>
          <button
            onClick={handleUseMax}
            className="flex items-center gap-1 rounded-full bg-[#222] px-3 py-1 text-sm font-semibold transition-colors hover:bg-[#333]"
            aria-label="Use maximum balance"
          >
            <motion.span
              animate={{ width: bounds.width > 0 ? bounds.width : "auto" }}
            >
              <span ref={ref} className="inline-flex overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {usedMax ? (
                    <motion.span
                      key="using"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Using{" "}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="use"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Use{" "}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.span>
            Max
          </button>
        </div>
      </Container>

      {/* Amount Input */}
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="relative w-full overflow-hidden text-center">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-center text-[56px] font-bold tracking-tight text-transparent caret-transparent outline-none"
            placeholder="0"
            value={inputValue}
            onChange={handleInputChange}
            aria-label="Enter swap amount"
            aria-describedby={isInsufficient ? "amount-error" : undefined}
            aria-invalid={isInsufficient ? true : undefined}
            autoFocus
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <AnimatePresence initial={false} mode="popLayout">
              {digits.map((digit, index) => (
                <motion.span
                  key={`${digit}-${index}`}
                  className="text-[56px] font-bold tracking-tight"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                >
                  {digit}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* USD Value / Error Message */}
        <div className="flex w-full items-center justify-center gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {!isInsufficient ? (
              <motion.div
                key="usd-value"
                style={{ transformOrigin: "top center" }}
                initial={{ opacity: 0, y: "100%", scale: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <div className="rounded-full bg-[#222] p-1">
                  <Equal className="size-5" aria-hidden="true" />
                </div>
                <motion.div
                  animate={{ width: bounds2.width }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <div
                    ref={ref2}
                    className="font-lg flex justify-between font-semibold tracking-tight"
                  >
                    <NumberFlow
                      value={usdValue}
                      format={{ style: "currency", currency: "USD" }}
                      aria-label={`USD value: ${usdValue.toFixed(2)}`}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.p
                key="not-enough"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  x: [0, -5, 5, -3, 3, 0],
                  transition: {
                    x: {
                      delay: 0.2,
                      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    },
                    type: "spring",
                    stiffness: 400,
                    damping: 35,
                  },
                }}
                exit={{ opacity: 0, scale: 0 }}
                style={{ transformOrigin: "bottom center" }}
                className="font-lg w-max text-center font-semibold tracking-tight text-red-500"
                id="amount-error"
                role="alert"
              >
                Not Enough {tokenIn.symbol}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Token Out Display */}
      <Container className="gap-2 rounded-[20px]">
        <span className="text-xs font-medium text-[var(--color-era-secondary)]">
          You Receive (estimated)
        </span>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tokenOut.logoURI ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokenOut.logoURI}
                alt={tokenOut.symbol}
                className="size-8 rounded-full"
                aria-hidden="true"
              />
            ) : (
              <div
                className="flex size-8 items-center justify-center rounded-full bg-[#333] text-xs font-bold"
                aria-hidden="true"
              >
                {tokenOut.symbol.slice(0, 2)}
              </div>
            )}
            <span className="font-medium">{tokenOut.symbol}</span>
          </div>
          <p className={cn("rounded-full pr-2 text-lg font-semibold", isLoading && "opacity-50")}>
            <NumberFlow
              value={tokenOutReceive}
              format={{
                minimumFractionDigits: 0,
                maximumFractionDigits: 8,
              }}
              aria-label={`You will receive approximately ${tokenOutReceive} ${tokenOut.symbol}`}
            />
          </p>
        </div>
      </Container>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {value > 0 && (
          <button
            onClick={handleClear}
            className="flex-1 rounded-full border border-[#303030] py-3 font-semibold transition-colors hover:bg-[#1a1a1a]"
            aria-label="Clear amount"
          >
            Clear
          </button>
        )}
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={cn(
            "rounded-full bg-white py-3 font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30",
            value > 0 ? "flex-1" : "w-full"
          )}
          aria-label="Continue to confirmation"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
