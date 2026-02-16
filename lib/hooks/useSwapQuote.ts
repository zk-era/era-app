/**
 * useSwapQuote Hook
 * 
 * React hook for fetching Uniswap quotes with ERA comparison
 * 
 * Best Practices:
 * - Uses React 18+ hooks (useState, useEffect, useCallback)
 * - Debouncing to prevent excessive API calls
 * - Automatic cleanup on unmount
 * - Error state management
 * - Loading states
 * 
 * Reference: https://react.dev/learn/reusing-logic-with-custom-hooks
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { calculateERASavings } from "@/lib/services/uniswap.service";
import type { UniswapQuoteResponse, ERAQuoteComparison } from "@/lib/types/swap";

interface UseSwapQuoteParams {
  tokenIn: {
    address: string;
    decimals: number;
  };
  tokenOut: {
    address: string;
    decimals: number;
  };
  amount: string;
  walletAddress?: string;
  chainId?: number;
  enabled?: boolean;
}

interface UseSwapQuoteResult {
  quote: UniswapQuoteResponse | null;
  comparison: ERAQuoteComparison | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEBOUNCE_MS = 500; // Wait 500ms after user stops typing

export function useSwapQuote({
  // These params are kept for API compatibility when real quotes are enabled
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokenIn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokenOut,
  amount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  walletAddress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chainId = 1,
  enabled = true,
}: UseSwapQuoteParams): UseSwapQuoteResult {
  const [quote, setQuote] = useState<UniswapQuoteResponse | null>(null);
  const [comparison, setComparison] = useState<ERAQuoteComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuote = useCallback(async () => {
    // Validation
    if (!enabled) return;
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      setComparison(null);
      return;
    }

    // DISABLED: Wait for real API keys
    // For now, calculate mock quote locally
    setIsLoading(false);
    
    try {
      // Mock exchange rate (will be replaced with real API)
      const mockRate = 10.87; // AAVE per ETH or similar
      const outputAmount = parseFloat(amount) * mockRate;
      const uniswapGasUSD = 48.75; // Typical gas cost

      const eraSavings = calculateERASavings(uniswapGasUSD);

      const comparisonData: ERAQuoteComparison = {
        uniswap: {
          inputAmount: amount,
          outputAmount: outputAmount.toString(),
          gasEstimateUSD: uniswapGasUSD,
          totalCostUSD: uniswapGasUSD,
        },
        era: {
          inputAmount: amount,
          outputAmount: outputAmount.toString(),
          gasEstimateUSD: eraSavings.eraGasUSD,
          totalCostUSD: eraSavings.eraGasUSD,
          savingsUSD: eraSavings.savingsUSD,
          savingsPercent: eraSavings.savingsPercent,
        },
      };

      setQuote(null);
      setComparison(comparisonData);
      setError(null);
      return;
    } catch {
      setError("Failed to calculate quote");
    }

    /* DISABLED UNTIL API KEYS WORK
    if (!walletAddress) {
      setError("Wallet address required");
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // Convert amount to base units
      const amountInBaseUnits = toBaseUnits(amount, tokenIn.decimals);

      const request: UniswapQuoteRequest = {
        type: "EXACT_INPUT",
        amount: amountInBaseUnits,
        tokenInChainId: chainId,
        tokenOutChainId: chainId,
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        swapper: walletAddress,
        slippageTolerance: 0.5, // 0.5% default slippage
        protocols: ["V2", "V3", "V4"],
        routingPreference: "BEST_PRICE",
      };

      const quoteResponse = await getUniswapQuote(request);
      
      // Calculate ERA comparison
      const outputAmount = quoteResponse.quote.aggregatedOutputs[0]?.amount || "0";
      const outputAmountFormatted = fromBaseUnits(outputAmount, tokenOut.decimals);
      const uniswapGasUSD = parseFloat(quoteResponse.quote.classicGasUseEstimateUSD || "0");

      const eraSavings = calculateERASavings(uniswapGasUSD);

      const comparisonData: ERAQuoteComparison = {
        uniswap: {
          inputAmount: amount,
          outputAmount: outputAmountFormatted,
          gasEstimateUSD: uniswapGasUSD,
          totalCostUSD: uniswapGasUSD,
        },
        era: {
          inputAmount: amount,
          outputAmount: outputAmountFormatted,
          gasEstimateUSD: eraSavings.eraGasUSD,
          totalCostUSD: eraSavings.eraGasUSD,
          savingsUSD: eraSavings.savingsUSD,
          savingsPercent: eraSavings.savingsPercent,
        },
      };

      setQuote(quoteResponse);
      setComparison(comparisonData);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch quote";
      setError(errorMessage);
      setQuote(null);
      setComparison(null);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
    */
  }, [enabled, amount]);

  // Debounced fetch
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchQuote();
    }, DEBOUNCE_MS);

    const currentAbortController = abortControllerRef.current;
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (currentAbortController) {
        currentAbortController.abort();
      }
    };
  }, [fetchQuote]);

  return {
    quote,
    comparison,
    isLoading,
    error,
    refetch: fetchQuote,
  };
}
