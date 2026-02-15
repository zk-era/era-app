/**
 * Token List Service
 * 
 * Fetches real token lists from 1inch API
 * Reference: https://business.1inch.com/portal/documentation/apis/swap/classic-swap/introduction
 */

import type { Token } from "@/lib/types/swap";

const ONEINCH_API_URL =
  process.env.NEXT_PUBLIC_ONEINCH_API_URL ||
  "https://api.1inch.dev/swap/v6.1";
const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_ONEINCH_API_KEY;

// Fallback: Uniswap's official token list URL
const UNISWAP_TOKEN_LIST_URL = "https://tokens.uniswap.org";

interface TokenListResponse {
  name: string;
  timestamp: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: Array<{
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  }>;
}

/**
 * Fetches tokens from 1inch API
 * Returns tokens available for swap on 1inch
 */
export async function fetch1inchTokenList(chainId: number = 1): Promise<Token[]> {
  if (!ONEINCH_API_KEY) {
    console.warn("1inch API key not configured, falling back to Uniswap token list");
    return fetchUniswapTokenList();
  }

  try {
    const response = await fetch(`${ONEINCH_API_URL}/${chainId}/tokens`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ONEINCH_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`1inch tokens API error: ${response.statusText}, falling back to Uniswap`);
      return fetchUniswapTokenList();
    }

    const data = await response.json();

    // 1inch returns object with token addresses as keys
    const tokens: Token[] = Object.entries(data).map(([address, tokenData]: [string, any]) => ({
      address,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      chainId,
      logoURI: tokenData.logoURI,
    }));

    return tokens;
  } catch (error) {
    console.error("Error fetching 1inch token list:", error);
    // Fallback to Uniswap
    return fetchUniswapTokenList();
  }
}

/**
 * Fetches the official Uniswap token list (FALLBACK)
 * This is a public endpoint, no API key needed for token list
 */
export async function fetchUniswapTokenList(): Promise<Token[]> {
  try {
    const response = await fetch(UNISWAP_TOKEN_LIST_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token list: ${response.statusText}`);
    }

    const data = (await response.json()) as TokenListResponse;
    
    // Filter for Ethereum mainnet tokens (chainId: 1)
    const mainnetTokens = data.tokens
      .filter((token) => token.chainId === 1)
      .map((token) => ({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        chainId: token.chainId,
        logoURI: token.logoURI,
      }));

    return mainnetTokens;
  } catch (error) {
    console.error("Error fetching Uniswap token list:", error);
    throw error;
  }
}

/**
 * Fetches popular tokens with fallback
 * Using Uniswap by default until we get working API keys
 */
export async function fetchPopularTokens(): Promise<Token[]> {
  try {
    // TEMPORARY: Use Uniswap until we get working API keys
    const allTokens = await fetchUniswapTokenList();
    
    // To enable 1inch when API works, uncomment:
    // const allTokens = await fetch1inchTokenList(1);
    
    // Popular tokens by trading volume (these are always at the top)
    const popularSymbols = [
      "ETH",
      "WETH",
      "USDC",
      "USDT",
      "DAI",
      "WBTC",
      "UNI",
      "LINK",
      "AAVE",
      "MATIC",
      "CRV",
      "LDO",
      "MKR",
      "SNX",
      "COMP",
      "SUSHI",
      "BAL",
      "YFI",
      "1INCH",
      "ENS",
    ];

    // Filter and sort by popular symbols
    const popularTokens = popularSymbols
      .map((symbol) => allTokens.find((t) => t.symbol === symbol))
      .filter((token): token is Token => token !== undefined);

    // Add remaining tokens up to 50
    const remainingTokens = allTokens
      .filter((t) => !popularSymbols.includes(t.symbol))
      .slice(0, 50 - popularTokens.length);

    return [...popularTokens, ...remainingTokens];
  } catch (error) {
    console.error("Error fetching popular tokens:", error);
    // Fallback to empty array, app will use local tokens
    return [];
  }
}

/**
 * Search tokens by symbol or address
 */
export function searchTokens(tokens: Token[], query: string): Token[] {
  const lowerQuery = query.toLowerCase();
  
  return tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.address.toLowerCase().includes(lowerQuery)
  );
}
