/**
 * Swap Input Step
 * Combined token selection + amount input (preserves working UI)
 * 
 * Uses Zustand store for state management (matching send flow architecture)
 */
"use client";

import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowDownUp, ChevronDown, Equal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useSwapQuote } from "@/lib/hooks/useSwapQuote";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";
import { useSwapStore } from "@/lib/stores/swapStore";
import { SEPOLIA_TOKENS } from "@/lib/constants/tokens";
import { TokenSelector } from "@/components/TokenSelector";

interface SwapInputStepProps {
  onContinue: () => void;
}

export function SwapInputStep({ onContinue }: SwapInputStepProps) {
  // Wallet connection
  const { address: userAddress } = useAccount();

  // Zustand store
  const tokenIn = useSwapStore((s) => s.tokenIn);
  const tokenOut = useSwapStore((s) => s.tokenOut);
  const amountIn = useSwapStore((s) => s.amountIn);
  const setTokenIn = useSwapStore((s) => s.setTokenIn);
  const setTokenOut = useSwapStore((s) => s.setTokenOut);
  const setAmountIn = useSwapStore((s) => s.setAmountIn);
  const setAmountOut = useSwapStore((s) => s.setAmountOut);

  // Local state for UI
  const [inputValue, setInputValue] = useState(amountIn);
  const [value, setValue] = useState(parseFloat(amountIn) || 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ref, bounds] = useMeasure();
  const [ref2, bounds2] = useMeasure();

  // Fetch tokens
  const { tokens: availableTokens, isLoading: tokensLoading } = useTokenBalances();

  // Set initial tokens once available
  useEffect(() => {
    if (availableTokens.length > 0 && !tokenIn && !tokenOut) {
      const usdc = availableTokens.find(t => t.symbol === "USDC");
      const weth = availableTokens.find(t => t.symbol === "WETH");
      if (usdc) setTokenIn(usdc);
      if (weth) setTokenOut(weth);
    }
  }, [availableTokens, tokenIn, tokenOut, setTokenIn, setTokenOut]);

  // Get real-time quote
  const { comparison } = useSwapQuote({
    tokenIn: tokenIn && tokenOut ? {
      address: tokenIn.address,
      decimals: tokenIn.decimals,
    } : {
      address: SEPOLIA_TOKENS.USDC.address,
      decimals: SEPOLIA_TOKENS.USDC.decimals,
    },
    tokenOut: tokenIn && tokenOut ? {
      address: tokenOut.address,
      decimals: tokenOut.decimals,
    } : {
      address: SEPOLIA_TOKENS.EURC.address,
      decimals: SEPOLIA_TOKENS.EURC.decimals,
    },
    amount: inputValue || "0",
    walletAddress: userAddress || "",
    enabled: value > 0 && !!tokenIn && !!tokenOut && !!userAddress,
  });

  // Calculations
  const tokenInBalance = tokenIn?.balance ?? 0;
  const tokenInPrice = tokenIn?.price ?? 1;
  const usdValue = value * tokenInPrice;
  const tokenOutReceive = value > 0 && comparison 
    ? parseFloat(comparison.uniswap.outputAmount)
    : 0;
  const isInsufficient = value > tokenInBalance;

  // Update store when output changes
  useEffect(() => {
    if (tokenOutReceive > 0) {
      setAmountOut(tokenOutReceive);
    }
  }, [tokenOutReceive, setAmountOut]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    if (!/^[0-9]*\.?[0-9]*$/.test(inputVal) && inputVal !== "") {
      return;
    }

    if (inputVal === "" || inputVal === ".") {
      setValue(0);
      setInputValue(inputVal);
      setAmountIn("");
      return;
    }

    if (inputVal.startsWith(".")) {
      setValue(0);
      setInputValue(inputVal);
      setAmountIn(inputVal);
      return;
    }

    const newValue = parseFloat(inputVal) || 0;
    const maxValue = 1000000;

    if (newValue > maxValue) {
      setValue(maxValue);
      setInputValue(maxValue.toString());
      setAmountIn(maxValue.toString());
    } else {
      setValue(newValue);
      setInputValue(inputVal);
      setAmountIn(inputVal);
    }
  };

  // Handle Use Max
  const handleUseMax = () => {
    setValue(tokenInBalance);
    setInputValue(tokenInBalance.toString());
    setAmountIn(tokenInBalance.toString());
  };

  // Format display
  const displayValue = inputValue || "0";
  const digits = displayValue.split("");

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 400, damping: 35 }}>
      <div className="flex flex-col items-center justify-center gap-3">
        {/* Token In */}
        <div className="relative flex w-[300px] flex-col items-center justify-center gap-5 rounded-3xl border border-[#303030]/50 bg-[#121212] px-3 py-3 sm:w-[350px]">
          <div className="flex w-full items-center justify-between">
            {tokenIn ? (
              <TokenSelector
                selectedToken={tokenIn}
                onSelectToken={setTokenIn}
                availableTokens={availableTokens}
                label={tokensLoading ? "Loading tokens..." : "Select token to pay"}
              />
            ) : (
              <div className="text-sm text-[var(--color-era-secondary)]">
                {tokensLoading ? "Loading tokens..." : "Select token"}
              </div>
            )}
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
                    {value > 111 ? (
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

          <div className="w-full border-t border-[#303030]/50" />

          {/* Amount Input */}
          <div className="mb-6 flex w-full flex-col items-center justify-center gap-4">
            <div className="relative w-[300px] overflow-hidden text-center">
              <input
                ref={inputRef}
                type="text"
                className={cn(
                  "inset-0 w-full cursor-pointer text-center text-[45px] font-semibold tracking-tight text-transparent caret-white outline-none",
                  inputValue === "" && "caret-transparent",
                )}
                placeholder="0"
                value={inputValue}
                onChange={handleInputChange}
                aria-label="Enter swap amount"
                aria-invalid={isInsufficient}
                autoFocus
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <AnimatePresence initial={false} mode="popLayout">
                  {digits.map((digit, index) => (
                    <motion.span
                      key={`${digit}-${index}`}
                      className="text-[45px] font-semibold tracking-tight"
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

            {/* USD Value / Error */}
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
                        <span>$</span>
                        {(() => {
                          const charCount: Record<string, number> = {};
                          return usdValue
                            .toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                            .split("")
                            .map((char) => {
                              charCount[char] = (charCount[char] || 0) + 1;
                              const isDuplicate = charCount[char] > 1;
                              const key = isDuplicate
                                ? `usd-${char}-dupChar-${charCount[char]}`
                                : `usd-${char}`;
                              return (
                                <motion.span
                                  key={key}
                                  layoutId={key}
                                  className="inline-block"
                                >
                                  {char}
                                </motion.span>
                              );
                            });
                        })()}
                      </div>
                    </motion.div>
                    <ArrowDownUp className="size-5" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.p
                    key="not-enough-eth"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      x: [0, -5, 5, -3, 3, 0],
                      transition: {
                        x: { delay: 0.2, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                      },
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    style={{ transformOrigin: "bottom center" }}
                    className="font-lg w-max text-center font-semibold tracking-tight text-red-500"
                    role="alert"
                  >
                    Not Enough {tokenIn?.symbol || "Token"}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="absolute -bottom-6 rounded-full border border-[#303030]/50 bg-[#121212] p-1.5">
            <ChevronDown className="size-5 opacity-50" aria-hidden="true" />
          </div>
        </div>

        {/* Token Out */}
        <div className="flex w-[300px] flex-col items-start justify-start gap-5 rounded-3xl border border-[#303030]/50 bg-[#121212] px-3 py-3 sm:w-[350px]">
          <div className="flex w-full items-center justify-between">
            {tokenOut ? (
              <TokenSelector
                selectedToken={tokenOut}
                onSelectToken={setTokenOut}
                availableTokens={availableTokens.filter(
                  (t) => t.address !== tokenIn?.address
                )}
                label="Select token to receive"
                subtitle={`Receive ${tokenOut.symbol}`}
              />
            ) : (
              <div className="text-sm text-[var(--color-era-secondary)]">
                {tokensLoading ? "Loading tokens..." : "Select token"}
              </div>
            )}
            <p className="rounded-full pr-2 text-lg font-semibold">
              <NumberFlow 
                value={tokenOutReceive}
                format={{
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 8,
                }}
                aria-label={`You will receive ${tokenOutReceive} ${tokenOut?.symbol}`}
              />
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          disabled={!tokenIn || !tokenOut || value === 0 || isInsufficient}
          className="w-full rounded-full bg-white py-3 font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Continue to confirmation"
        >
          Continue
        </button>
      </div>
    </MotionConfig>
  );
}
