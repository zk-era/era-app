/**
 * Uniswap API Types
 * Based on official documentation: https://api-docs.uniswap.org/api-reference/swapping/quote
 */

export type SwapType = "EXACT_INPUT" | "EXACT_OUTPUT";

export type Protocol = "V2" | "V3" | "V4" | "UNISWAPX_V2" | "UNISWAPX_V3";

export type RoutingPreference = "BEST_PRICE" | "FASTEST";

export interface Token {
  address: string;
  symbol: string;
  name?: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  balance?: number;
  price?: number;
}

export interface UniswapQuoteRequest {
  type: SwapType;
  amount: string;
  tokenInChainId: number;
  tokenOutChainId: number;
  tokenIn: string;
  tokenOut: string;
  swapper: string;
  slippageTolerance?: number;
  autoSlippage?: "DEFAULT";
  routingPreference?: RoutingPreference;
  protocols?: Protocol[];
}

export interface QuoteOutput {
  token: string;
  amount: string;
  recipient: string;
  bps: number;
  minAmount: string;
}

export interface UniswapQuoteResponse {
  requestId: string;
  quote: {
    quoteId: string;
    slippageTolerance: number;
    classicGasUseEstimateUSD: string;
    aggregatedOutputs: QuoteOutput[];
  };
  routing: string;
}

export interface ERAQuoteComparison {
  uniswap: {
    inputAmount: string;
    outputAmount: string;
    gasEstimateUSD: number;
    totalCostUSD: number;
  };
  era: {
    inputAmount: string;
    outputAmount: string;
    gasEstimateUSD: number;
    totalCostUSD: number;
    savingsUSD: number;
    savingsPercent: number;
  };
}

export interface SwapQuoteError {
  error: string;
  message: string;
  statusCode?: number;
}
