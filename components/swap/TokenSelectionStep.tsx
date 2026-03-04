/**
 * Phase 1: Token Selection
 * User selects tokenIn and tokenOut for the swap
 * 
 * Matches send flow architecture:
 * - Uses Zustand store for state management
 * - Uses TokenSelector for token picking
 * - Clean separation of concerns
 */
"use client";

import { ArrowDownUp } from "lucide-react";
import { useEffect } from "react";
import { SwapHeader } from "@/components/shared/SwapHeader";
import { TokenSelector } from "@/components/TokenSelector";
import { Container } from "@/components/ui/container";
import { useSwapStore } from "@/lib/stores/swapStore";
import { useTokenBalances } from "@/lib/hooks/useTokenBalances";
import type { Token } from "@/lib/types/swap";

interface TokenSelectionStepProps {
  onContinue: () => void;
}

export function TokenSelectionStep({ onContinue }: TokenSelectionStepProps) {
  // Zustand store
  const tokenIn = useSwapStore((s) => s.tokenIn);
  const tokenOut = useSwapStore((s) => s.tokenOut);
  const setTokenIn = useSwapStore((s) => s.setTokenIn);
  const setTokenOut = useSwapStore((s) => s.setTokenOut);
  const swapTokens = useSwapStore((s) => s.swapTokens);

  // Fetch Sepolia testnet tokens with balances
  const { tokens: availableTokens, isLoading: tokensLoading } = useTokenBalances();

  // Set default tokens once available (USDC → WETH)
  useEffect(() => {
    if (availableTokens.length > 0 && !tokenIn && !tokenOut) {
      const usdc = availableTokens.find((t) => t.symbol === "USDC");
      const weth = availableTokens.find((t) => t.symbol === "WETH");

      if (usdc) setTokenIn(usdc);
      if (weth) setTokenOut(weth);
    }
  }, [availableTokens, tokenIn, tokenOut, setTokenIn, setTokenOut]);

  // Check if user can continue
  const canContinue = tokenIn && tokenOut && tokenIn.address !== tokenOut.address;

  return (
    <div className="flex flex-col gap-6">
      <SwapHeader />

      {/* Token In */}
      <Container className="gap-2 rounded-[20px]">
        <span className="text-xs font-medium text-[var(--color-era-secondary)]">
          You Pay
        </span>
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
      </Container>

      {/* Swap Direction Button */}
      <div className="flex justify-center">
        <button
          onClick={swapTokens}
          disabled={!tokenIn && !tokenOut}
          className="rounded-full border border-[#303030]/50 bg-[#121212] p-2 transition-colors hover:bg-[#1a1a1a] disabled:opacity-30"
          aria-label="Swap token direction"
        >
          <ArrowDownUp className="size-5" aria-hidden="true" />
        </button>
      </div>

      {/* Token Out */}
      <Container className="gap-2 rounded-[20px]">
        <span className="text-xs font-medium text-[var(--color-era-secondary)]">
          You Receive
        </span>
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
      </Container>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full rounded-full bg-white py-3 font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Continue to amount selection"
      >
        Continue
      </button>
    </div>
  );
}
