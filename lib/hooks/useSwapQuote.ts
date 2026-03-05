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
import { usePublicClient } from "wagmi";
import { parseAbi, parseUnits, formatUnits } from "viem";
import { calculateERASavings } from "@/lib/services/uniswap.service";
import { logger } from "@/lib/utils/logger";
import type { UniswapQuoteResponse, ERAQuoteComparison } from "@/lib/types/swap";

// Uniswap V2 Router address on Sepolia
const UNISWAP_V2_ROUTER_SEPOLIA = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

// Uniswap V2 Router ABI for getting quotes
const UNISWAP_V2_ROUTER_ABI = parseAbi([
  "function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)",
]);

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
  tokenIn,
  tokenOut,
  amount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  walletAddress,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chainId = 1,
  enabled = true,
}: UseSwapQuoteParams): UseSwapQuoteResult {
  const publicClient = usePublicClient();
  const [quote, setQuote] = useState<UniswapQuoteResponse | null>(null);
  const [comparison, setComparison] = useState<ERAQuoteComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuote = useCallback(async () => {
    // Validation
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      setComparison(null);
      setIsLoading(false);
      return;
    }

    if (!publicClient) {
      setError("No provider available");
      setIsLoading(false);
      return;
    }

    // Query real V2 pool for actual swap rate
    setIsLoading(true);
    
    try {
      // Convert input amount to wei/smallest unit
      const amountInWei = parseUnits(amount, tokenIn.decimals);
      
      // Path for V2 swap
      const path = [
        tokenIn.address as `0x${string}`,
        tokenOut.address as `0x${string}`,
      ];

      // Call Uniswap V2 Router to get actual output amount
      const amounts = await publicClient.readContract({
        address: UNISWAP_V2_ROUTER_SEPOLIA,
        abi: UNISWAP_V2_ROUTER_ABI,
        functionName: "getAmountsOut",
        args: [amountInWei, path],
      });

      // amounts[0] = input amount, amounts[1] = output amount
      const outputAmountWei = amounts[1];
      
      // Use viem's formatUnits to properly convert BigInt to decimal string
      const outputAmount = parseFloat(formatUnits(outputAmountWei, tokenOut.decimals));

      const uniswapGasUSD = 48.75; // Typical V2 gas cost
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
      setIsLoading(false);
    } catch (err) {
      logger.error("useSwapQuote", "Error fetching V2 quote:", err);
      setError("Failed to get quote from pool");
      setIsLoading(false);
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
  }, [enabled, amount, tokenIn.address, tokenIn.decimals, tokenOut.address, tokenOut.decimals, publicClient]);

  // Debounced fetch
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchQuote();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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
