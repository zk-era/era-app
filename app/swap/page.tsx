"use client";

/**
 * Swap Page Orchestrator
 * 
 * Matches send flow architecture:
 * - Step-based navigation (input → confirm)
 * - Zustand store for state management
 * - AnimatePresence transitions
 * - Preserves working UI
 */

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useState } from "react";
import { useSwapStore } from "@/lib/stores/swapStore";
import { useERASwap } from "@/lib/hooks/useERASwap";
import { SwapInputStep } from "@/components/swap/SwapInputStep";
import { SwapConfirmStep } from "@/components/swap/SwapConfirmStep";
import { SepoliaLimitationBanner } from "@/components/swap/SepoliaLimitationBanner";

type Step = "input" | "confirm";

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export default function SwapPage() {
  const [step, setStep] = useState<Step>("input");
  const [direction, setDirection] = useState(1);

  // Zustand store
  const tokenIn = useSwapStore((s) => s.tokenIn);
  const tokenOut = useSwapStore((s) => s.tokenOut);
  const amountIn = useSwapStore((s) => s.amountIn);
  const amountOut = useSwapStore((s) => s.amountOut);
  const reset = useSwapStore((s) => s.reset);

  // ERA Swap hook
  const { status: swapStatus, swap } = useERASwap({
    onComplete: () => {
      reset();
      setStep("input");
    },
  });

  // Navigation
  const goToConfirm = () => {
    setDirection(1);
    setStep("confirm");
  };

  const goBackToInput = () => {
    setDirection(-1);
    setStep("input");
  };

  // Handle confirmation
  const handleConfirm = (batchSize: number, slippage: number) => {
    if (!tokenIn || !tokenOut) return;
    
    swap({
      tokenIn: tokenIn.address,
      tokenInSymbol: tokenIn.symbol,
      tokenInDecimals: tokenIn.decimals,
      tokenOut: tokenOut.address,
      tokenOutSymbol: tokenOut.symbol,
      tokenOutDecimals: tokenOut.decimals,
      amountIn: amountIn,
      slippagePercent: slippage,
      batchSize,
    });
  };

  // Get comparison for ConfirmStep (will fetch inside)
  const comparison = null; // SwapConfirmStep will fetch its own quote

  return (
    <div className="flex w-full flex-col self-start pt-20">
      <SepoliaLimitationBanner />
      <MotionConfig transition={{ type: "spring", stiffness: 400, damping: 35 }}>
        <div className="flex w-full max-w-[400px] flex-col px-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {step === "input" && (
                <SwapInputStep onContinue={goToConfirm} />
              )}

              {step === "confirm" && tokenIn && tokenOut && (
                <SwapConfirmStep
                  tokenIn={tokenIn}
                  tokenOut={tokenOut}
                  amountIn={parseFloat(amountIn)}
                  amountOut={amountOut}
                  comparison={comparison}
                  onBack={goBackToInput}
                  onConfirm={handleConfirm}
                  isProcessing={swapStatus !== "idle" && swapStatus !== "completed" && swapStatus !== "failed"}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </MotionConfig>
    </div>
  );
}
