/**
 * Alchemy API Utilities
 * 
 * Direct API calls to Alchemy for token discovery and metadata.
 * No SDK needed - just fetch() calls to their JSON-RPC endpoints.
 */

const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_ID || "";
const ALCHEMY_URL = `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`;

export interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string; // hex string
}

export interface AlchemyTokenMetadata {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  logo: string | null;
}

export interface AlchemyTokenPrice {
  prices: Array<{
    address: string;
    lastUpdatedAt: string;
    network: string;
    symbol: string;
    currency: string;
    value: number;
    error?: string;
  }>;
}

/**
 * Get all ERC20 token balances for an address
 * Uses alchemy_getTokenBalances with "erc20" filter
 */
export async function getTokenBalances(
  address: string
): Promise<AlchemyTokenBalance[]> {
  const response = await fetch(ALCHEMY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenBalances",
      params: [address, "erc20"],
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Alchemy API error: ${data.error.message}`);
  }

  return data.result.tokenBalances || [];
}

/**
 * Get metadata for a specific token contract
 * Uses alchemy_getTokenMetadata
 */
export async function getTokenMetadata(
  contractAddress: string
): Promise<AlchemyTokenMetadata> {
  const response = await fetch(ALCHEMY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenMetadata",
      params: [contractAddress],
    }),
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Alchemy API error: ${data.error.message}`);
  }

  return data.result;
}

/**
 * Get token prices in USD
 * Uses Alchemy Prices API (REST endpoint, not JSON-RPC)
 * Endpoint: POST https://api.g.alchemy.com/prices/v1/{apiKey}/tokens/by-address
 */
export async function getTokenPrices(
  contractAddresses: string[]
): Promise<AlchemyTokenPrice> {
  const pricesUrl = `https://api.g.alchemy.com/prices/v1/${ALCHEMY_ID}/tokens/by-address`;
  
  const response = await fetch(pricesUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addresses: contractAddresses.map((addr) => ({
        network: "eth-sepolia",
        address: addr,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Alchemy Prices API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Get token balances with full metadata and prices
 * Fetches balances, filters to non-zero, then gets metadata and prices for each
 */
export async function getTokenBalancesWithMetadata(
  address: string
): Promise<Array<AlchemyTokenBalance & AlchemyTokenMetadata & { price?: number }>> {
  // Get all balances
  const balances = await getTokenBalances(address);
  
  // Filter to only tokens with balance > 0
  const nonZeroBalances = balances.filter(
    (token) => token.tokenBalance !== "0x0" && token.tokenBalance !== "0"
  );

  if (nonZeroBalances.length === 0) {
    return [];
  }

  // Fetch metadata and prices in parallel
  const metadataPromises = nonZeroBalances.map((token) =>
    getTokenMetadata(token.contractAddress)
  );
  
  const contractAddresses = nonZeroBalances.map((t) => t.contractAddress);
  const [metadataResults, priceData] = await Promise.all([
    Promise.all(metadataPromises),
    getTokenPrices(contractAddresses).catch(() => ({ prices: [] })), // Graceful fallback if pricing fails
  ]);

  // Create a price map for easy lookup
  const priceMap = new Map(
    priceData.prices.map((p) => [p.address.toLowerCase(), p.value])
  );

  // Combine balances with metadata and prices
  return nonZeroBalances.map((token, index) => ({
    ...token,
    ...metadataResults[index],
    price: priceMap.get(token.contractAddress.toLowerCase()),
  }));
}
