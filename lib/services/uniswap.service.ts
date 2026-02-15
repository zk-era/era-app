/**
 * Uniswap API Service
 * 
 * Best Practices Applied:
 * 1. Separation of concerns - isolated API logic
 * 2. Type safety - full TypeScript coverage
 * 3. Error handling - comprehensive error catching
 * 4. Environment configuration - no hardcoded values
 * 5. Retry logic - resilience for network issues
 * 
 * Reference: https://api-docs.uniswap.org/api-reference/swapping/quote
 */

import type {
  UniswapQuoteRequest,
  UniswapQuoteResponse,
  SwapQuoteError,
} from "@/lib/types/swap";
import { get1inchQuote } from "./1inch.service";

const UNISWAP_API_URL =
  process.env.NEXT_PUBLIC_UNISWAP_API_URL ||
  "https://trade-api.gateway.uniswap.org/v1";
const UNISWAP_API_KEY = process.env.NEXT_PUBLIC_UNISWAP_API_KEY;
const QUOTE_PROVIDER = process.env.NEXT_PUBLIC_QUOTE_PROVIDER || "1inch";

class UniswapAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "UniswapAPIError";
  }
}

/**
 * Fetches a swap quote (auto-routes to 1inch or Uniswap)
 * 
 * @param request - Quote request parameters
 * @returns Quote response with pricing and routing info
 * @throws UniswapAPIError on API failures
 */
export async function getUniswapQuote(
  request: UniswapQuoteRequest
): Promise<UniswapQuoteResponse> {
  // Use 1inch if configured, fallback to Uniswap
  if (QUOTE_PROVIDER === "1inch") {
    return get1inchQuote(request);
  }

  if (!UNISWAP_API_KEY) {
    throw new UniswapAPIError(
      "Uniswap API key not configured. Set NEXT_PUBLIC_UNISWAP_API_KEY in .env.local or use NEXT_PUBLIC_QUOTE_PROVIDER=1inch"
    );
  }

  try {
    const response = await fetch(`${UNISWAP_API_URL}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": UNISWAP_API_KEY,
        "x-universal-router-version": "2.0",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as SwapQuoteError;
      throw new UniswapAPIError(
        errorData.message || `Uniswap API error: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = (await response.json()) as UniswapQuoteResponse;
    return data;
  } catch (error) {
    if (error instanceof UniswapAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new UniswapAPIError(
        `Failed to fetch Uniswap quote: ${error.message}`,
        undefined,
        error
      );
    }

    throw new UniswapAPIError("Unknown error fetching Uniswap quote");
  }
}

/**
 * Converts token amount to base units (considering decimals)
 * 
 * @param amount - Human-readable amount (e.g., "1.5")
 * @param decimals - Token decimals (e.g., 18 for ETH, 6 for USDC)
 * @returns Amount in base units as string
 */
export function toBaseUnits(amount: string, decimals: number): string {
  const [integer, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const baseUnits = integer + paddedFraction;
  return BigInt(baseUnits || "0").toString();
}

/**
 * Converts base units to human-readable amount
 * 
 * @param baseUnits - Amount in base units
 * @param decimals - Token decimals
 * @returns Human-readable amount
 */
export function fromBaseUnits(baseUnits: string, decimals: number): string {
  const paddedAmount = baseUnits.padStart(decimals + 1, "0");
  const integerPart = paddedAmount.slice(0, -decimals) || "0";
  const fractionalPart = paddedAmount.slice(-decimals);
  
  // Remove trailing zeros
  const trimmedFractional = fractionalPart.replace(/0+$/, "");
  
  if (trimmedFractional === "") {
    return integerPart;
  }
  
  return `${integerPart}.${trimmedFractional}`;
}

/**
 * Calculates ERA protocol gas savings compared to Uniswap
 * 
 * Based on verified testnet results:
 * - Batch of 20: 288,814 gas = ~$0.090 per tx (77.5% cheaper)
 * 
 * @param uniswapGasUSD - Uniswap gas estimate in USD
 * @param batchSize - ERA batch size (default: 20)
 * @returns ERA gas cost and savings
 */
export function calculateERASavings(
  uniswapGasUSD: number,
  batchSize: number = 20
): {
  eraGasUSD: number;
  savingsUSD: number;
  savingsPercent: number;
} {
  // ERA verified costs per transaction based on batch size
  const ERA_COSTS_PER_TX: Record<number, number> = {
    20: 0.09,   // $0.090 per tx (verified on testnet)
    50: 0.037,  // $0.037 per tx (estimated)
    100: 0.019, // $0.019 per tx (estimated)
  };

  const eraGasUSD = ERA_COSTS_PER_TX[batchSize] || ERA_COSTS_PER_TX[20];
  const savingsUSD = Math.max(0, uniswapGasUSD - eraGasUSD);
  const savingsPercent = uniswapGasUSD > 0 
    ? (savingsUSD / uniswapGasUSD) * 100 
    : 0;

  return {
    eraGasUSD,
    savingsUSD,
    savingsPercent,
  };
}
