/**
 * 1inch API Service
 * 
 * API Docs: https://portal.1inch.dev/documentation/swap/introduction
 * Free Tier: 100k requests/month, 60 requests/minute
 */

import type {
  UniswapQuoteRequest,
  UniswapQuoteResponse,
} from "@/lib/types/swap";

const ONEINCH_API_URL =
  process.env.NEXT_PUBLIC_ONEINCH_API_URL ||
  "https://api.1inch.dev/swap/v6.1";
const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

class OneInchAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "OneInchAPIError";
  }
}

/**
 * Fetches a swap quote from 1inch API
 * Converts to Uniswap-compatible format
 */
export async function get1inchQuote(
  request: UniswapQuoteRequest
): Promise<UniswapQuoteResponse> {
  if (!ONEINCH_API_KEY) {
    throw new OneInchAPIError(
      "1inch API key not configured. Set NEXT_PUBLIC_ONEINCH_API_KEY in .env.local"
    );
  }

  try {
    // Convert Uniswap request format to 1inch format
    const params = new URLSearchParams({
      src: request.tokenIn,
      dst: request.tokenOut,
      amount: request.amount,
      includeTokensInfo: "true",
      includeProtocols: "true",
      includeGas: "true",
    });

    const response = await fetch(
      `${ONEINCH_API_URL}/${request.tokenInChainId}/quote?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new OneInchAPIError(
        errorData.description ||
          errorData.message ||
          `1inch API error: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    // Convert 1inch response to Uniswap format
    return {
      requestId: `1inch-${Date.now()}`,
      quote: {
        quoteId: `1inch-${Date.now()}`,
        slippageTolerance: request.slippageTolerance || 0.5,
        classicGasUseEstimateUSD: data.estimatedGas
          ? ((parseInt(data.estimatedGas) * 30 * 2500) / 1e18 / 1e9).toFixed(2)
          : "0.40", // Default gas estimate ~$0.40 for simple swap
        aggregatedOutputs: [
          {
            token: request.tokenOut,
            amount: data.dstAmount || data.toAmount || "0",
            recipient: request.swapper,
            bps: 0,
            minAmount: data.dstAmount || data.toAmount || "0",
          },
        ],
      },
      routing: "CLASSIC",
    };
  } catch (error) {
    if (error instanceof OneInchAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new OneInchAPIError(
        `Failed to fetch 1inch quote: ${error.message}`,
        undefined,
        error
      );
    }

    throw new OneInchAPIError("Unknown error fetching 1inch quote");
  }
}
