"use client";

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useState, useEffect } from "react";
import type { Token } from "@/lib/types/swap";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";
import { useRecentSends } from "@/lib/hooks/useRecentSends";
import { useERASend } from "@/lib/hooks/useERASend";
import { AddressStep } from "@/components/send/AddressStep";
import { TokenStep } from "@/components/send/TokenStep";
import { AmountStep } from "@/components/send/AmountStep";
import { ConfirmStep } from "@/components/send/ConfirmStep";
import { StatusStep } from "@/components/send/StatusStep";
import { ResultStep } from "@/components/send/ResultStep";

type Step = "address" | "token" | "amount" | "confirm" | "status" | "result";

const STEPS: Step[] = ["address", "token", "amount", "confirm", "status", "result"];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export default function SendPage() {
  const { tokens, isLoading, isConnected } = useTokenBalances();
  const { recentSends, addRecentSend } = useRecentSends();
  const { status: sendStatus, jobStatus, result, error, send, reset } = useERASend();
  
  const [step, setStep] = useState<Step>("address");
  const [direction, setDirection] = useState(1);
  const [recipient, setRecipient] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [isUsdMode, setIsUsdMode] = useState(true);
  const [usedMax, setUsedMax] = useState(false);
  const [batchSize, setBatchSize] = useState<20 | 50 | 100>(20);

  // Move to status step when sending starts
  useEffect(() => {
    if (sendStatus === "signing" || sendStatus === "submitting" || sendStatus === "processing") {
      if (step !== "status") {
        goTo("status");
      }
    }
  }, [sendStatus]);

  // Move to result step when completed
  useEffect(() => {
    if (sendStatus === "completed" && result) {
      goTo("result");
    }
  }, [sendStatus, result]);

  const numericAmount = parseFloat(amount) || 0;
  const tokenPrice = selectedToken?.price ?? 1;
  const usdValue = isUsdMode ? numericAmount : numericAmount * tokenPrice;
  const tokenValue = isUsdMode
    ? tokenPrice > 0 ? numericAmount / tokenPrice : 0
    : numericAmount;

  const isValidAddress =
    /^0x[a-fA-F0-9]{40}$/.test(recipient) ||
    /^[a-zA-Z0-9-]+\.eth$/.test(recipient);

  const truncatedRecipient = recipient.endsWith(".eth")
    ? recipient
    : recipient.length > 10
      ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}`
      : recipient;

  const goTo = (next: Step) => {
    setDirection(STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const handleUseMax = () => {
    if (!selectedToken) return;
    setUsedMax(true);
    const balance = selectedToken.balance ?? 0;
    if (isUsdMode) {
      setAmount((balance * tokenPrice).toString());
    } else {
      setAmount(balance.toString());
    }
  };

  const toggleMode = () => {
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
                recipient={recipient}
                onRecipientChange={setRecipient}
                isValidAddress={isValidAddress}
                onContinue={() => goTo("token")}
                recentSends={recentSends}
              />
            )}

            {step === "token" && (
              <TokenStep
                tokens={tokens}
                isLoading={isLoading}
                isConnected={isConnected}
                truncatedRecipient={truncatedRecipient}
                onSelectToken={(token) => {
                  setSelectedToken(token);
                  setAmount("");
                  setUsedMax(false);
                  goTo("amount");
                }}
                onBack={() => goTo("address")}
              />
            )}

            {step === "amount" && selectedToken && (
              <AmountStep
                selectedToken={selectedToken}
                truncatedRecipient={truncatedRecipient}
                amount={amount}
                isUsdMode={isUsdMode}
                numericAmount={numericAmount}
                usdValue={usdValue}
                tokenValue={tokenValue}
                onAmountChange={setAmount}
                onToggleMode={toggleMode}
                onUseMax={handleUseMax}
                onReview={() => goTo("confirm")}
                onBack={() => goTo("token")}
              />
            )}

            {step === "confirm" && selectedToken && (
              <ConfirmStep
                selectedToken={selectedToken}
                truncatedRecipient={truncatedRecipient}
                numericAmount={numericAmount}
                isUsdMode={isUsdMode}
                tokenValue={tokenValue}
                usedMax={usedMax}
                batchSize={batchSize}
                onBatchSizeChange={setBatchSize}
                onEditAmount={() => goTo("amount")}
                onConfirm={() => {
                  // Save recipient to recent sends
                  const ensName = recipient.endsWith(".eth") ? recipient : undefined;
                  const address = recipient.endsWith(".eth") ? recipient : recipient;
                  addRecentSend(address, ensName);
                  
                  // Execute ERA transaction
                  // Format tokenValue to max token decimals to avoid float precision issues
                  const formattedAmount = tokenValue.toFixed(selectedToken.decimals);
                  send({
                    to: recipient,
                    token: selectedToken.address,
                    amount: formattedAmount,
                    decimals: selectedToken.decimals,
                    batchSize,
                  });
                }}
              />
            )}

            {step === "status" && (
              <StatusStep
                sendStatus={sendStatus}
                jobStatus={jobStatus}
                error={error}
                onRetry={() => {
                  reset();
                  goTo("confirm");
                }}
              />
            )}

            {step === "result" && result && (
              <ResultStep
                result={result}
                onDone={() => {
                  // Reset everything and go back to start
                  reset();
                  setRecipient("");
                  setSelectedToken(null);
                  setAmount("");
                  setUsedMax(false);
                  goTo("address");
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
