/**
 * Common token addresses and metadata
 * Source: https://tokenlists.org/
 */

import type { Token } from "@/lib/types/swap";

// Native ETH address (used by Uniswap API)
export const NATIVE_ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

// Mainnet tokens
export const MAINNET_TOKENS: Record<string, Token> = {
  ETH: {
    address: NATIVE_ETH_ADDRESS,
    symbol: "ETH",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
  },
  WETH: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    symbol: "WETH",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png",
  },
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    decimals: 6,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
  },
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    decimals: 6,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
  },
  DAI: {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    symbol: "DAI",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png",
  },
  AAVE: {
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    symbol: "AAVE",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9.png",
  },
  UNI: {
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    symbol: "UNI",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png",
  },
  WBTC: {
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    symbol: "WBTC",
    decimals: 8,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  },
  LINK: {
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    symbol: "LINK",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png",
  },
  MATIC: {
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    symbol: "MATIC",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png",
  },
};

// Sepolia testnet tokens (for testing)
export const SEPOLIA_TOKENS: Record<string, Token> = {
  ETH: {
    address: NATIVE_ETH_ADDRESS,
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    chainId: 11155111,
  },
  USDC: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    chainId: 11155111,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  },
  EURC: {
    address: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    chainId: 11155111,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c/logo.png",
  },
  PYUSD: {
    address: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
    symbol: "PYUSD",
    name: "PayPal USD",
    decimals: 6,
    chainId: 11155111,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6c3ea9036406852006290770BEdFcAbA0e23A0e8/logo.png",
  },
};



/**
 * Get token by symbol for the current chain
 */
export function getTokenBySymbol(
  symbol: string,
  chainId: number = 1
): Token | undefined {
  const tokens = chainId === 11155111 ? SEPOLIA_TOKENS : MAINNET_TOKENS;
  return tokens[symbol];
}

/**
 * Get all tokens for a chain
 */
export function getTokensForChain(chainId: number = 1): Token[] {
  const tokens = chainId === 11155111 ? SEPOLIA_TOKENS : MAINNET_TOKENS;
  return Object.values(tokens);
}
