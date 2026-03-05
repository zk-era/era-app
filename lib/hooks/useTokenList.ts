/**
 * useTokenList Hook
 * 
 * Fetches and caches real token lists from Uniswap
 */

import { useState, useEffect } from "react";
import { fetchPopularTokens } from "@/lib/services/tokenlist.service";
import { getTokensForChain } from "@/lib/constants/tokens";
import { logger } from "@/lib/utils/logger";
import type { Token } from "@/lib/types/swap";

interface UseTokenListResult {
  tokens: Token[];
  isLoading: boolean;
  error: string | null;
}

export function useTokenList(chainId: number = 1): UseTokenListResult {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTokens() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch real tokens from Uniswap
        const uniswapTokens = await fetchPopularTokens();
        
        if (!mounted) return;

        if (uniswapTokens.length > 0) {
          setTokens(uniswapTokens);
        } else {
          // Fallback to local tokens if API fails
          logger.warn("TokenList", "Using fallback local token list");
          setTokens(getTokensForChain(chainId));
        }
      } catch (err) {
        if (!mounted) return;
        
        logger.error("TokenList", "Failed to load token list:", err);
        setError(err instanceof Error ? err.message : "Failed to load tokens");
        
        // Fallback to local tokens
        setTokens(getTokensForChain(chainId));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadTokens();

    return () => {
      mounted = false;
    };
  }, [chainId]);

  return { tokens, isLoading, error };
}
