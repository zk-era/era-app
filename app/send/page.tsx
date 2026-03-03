"use client";

/**
 * Send Flow with Toast Notifications
 *
 * Transaction progress and results are shown via Sileo toast notifications.
 * Users stay on the confirm screen while toasts show progress, then a success
 * toast displays gas savings with an Etherscan link. No separate result screen.
 * 
 * Phase 2 Updates:
 * - Uses Zustand store for all send flow state
 * - Simplified orchestration (components manage their own state)
 * - Cleaner step navigation
 */

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useState } from "react";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";
import { useRecentSends } from "@/lib/hooks/useRecentSends";
import { useERASend } from "@/lib/hooks/useERASend";
import { useSendStore } from "@/lib/stores/sendStore";
import { AddressStep } from "@/components/send/AddressStep";
import { TokenStep } from "@/components/send/TokenStep";
import { AmountStep } from "@/components/send/AmountStep";
import { ConfirmStep } from "@/components/send/ConfirmStep";

type Step = "address" | "token" | "amount" | "confirm";

const STEPS: Step[] = ["address", "token", "amount", "confirm"];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export default function SendPage() {
  const { tokens, isLoading, isConnected } = useTokenBalances();
  const { recentSends, addRecentSend } = useRecentSends();
  const [step, setStep] = useState<Step>("address");
  const [direction, setDirection] = useState(1);
  
  // Zustand store - direct selectors (v5 best practice)
  const reset = useSendStore((s) => s.reset);

  const { status: sendStatus, send } = useERASend({
    onComplete: () => {
      reset();
      setStep("address");
    },
  });

  const goTo = (next: Step) => {
    setDirection(STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const handleConfirm = () => {
    // Read state directly from store at confirmation time
    const state = useSendStore.getState();
    const { recipient, resolvedAddress, selectedToken, amount, isUsdMode, batchSize } = state;
    
    if (!selectedToken) return;
    
    // Use resolved address (0x...) instead of ENS name for transaction
    const txAddress = resolvedAddress || recipient;
    
    // Save recipient to recent sends
    const ensName = recipient.endsWith(".eth") || (!recipient.startsWith("0x") && recipient.length >= 3) 
      ? recipient 
      : undefined;
    addRecentSend(txAddress, ensName);
    
    // Calculate values
    const numericAmount = parseFloat(amount) || 0;
    const tokenPrice = selectedToken.price ?? 1;
    const tokenValue = isUsdMode
      ? tokenPrice > 0 ? numericAmount / tokenPrice : 0
      : numericAmount;
    const usdValue = isUsdMode ? numericAmount : numericAmount * tokenPrice;
    
    // Execute ERA transaction
    const formattedAmount = tokenValue.toFixed(selectedToken.decimals);
    const formattedUsd = usdValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    send({
      to: txAddress,
      token: selectedToken.address,
      tokenSymbol: selectedToken.symbol,
      tokenLogo: selectedToken.logoURI,
      amount: formattedAmount,
      usdValue: formattedUsd,
      decimals: selectedToken.decimals,
      batchSize,
    });
  };

  return (
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
            {step === "address" && (
              <AddressStep
                onContinue={() => goTo("token")}
                recentSends={recentSends}
              />
            )}

            {step === "token" && (
              <TokenStep
                tokens={tokens}
                isLoading={isLoading}
                isConnected={isConnected}
                onContinue={() => goTo("amount")}
                onBack={() => goTo("address")}
              />
            )}

            {step === "amount" && (
              <AmountStep
                onContinue={() => goTo("confirm")}
                onBack={() => goTo("token")}
              />
            )}

            {step === "confirm" && (
              <ConfirmStep
                isProcessing={sendStatus !== "idle" && sendStatus !== "completed" && sendStatus !== "failed"}
                onEditAmount={() => goTo("amount")}
                onConfirm={handleConfirm}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
