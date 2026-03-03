/**
 * Chain-Specific Contract Registry
 *
 * Architecture Decision:
 * Contract addresses are centralized here rather than hardcoded in hooks/components.
 * This enables:
 * - Easy multi-chain deployment (add new chainId keys as we expand)
 * - Single source of truth for all contract addresses
 * - Type-safe chain validation via `isSupportedChain()`
 * - Dynamic EIP-712 domain generation per chain
 *
 * When deploying to a new chain:
 * 1. Add the chainId as a key in CONTRACTS
 * 2. Deploy contracts and add their addresses
 * 3. Update wagmi config to include the new chain
 */

export const CONTRACTS = {
  11155111: {
    // Sepolia Testnet - Deployed Mar 3, 2026 (Fresh deployment with Exact Match verification)
    settlement: "0xDb41E9279D4c1BFc3ED90D2B1f0dbc4C4ba08c83" as const,
  },
  1: {
    // Ethereum Mainnet (placeholder for production)
    settlement: "0x0000000000000000000000000000000000000000" as const,
  },
} as const;

export type SupportedChainId = keyof typeof CONTRACTS;

export function getContractAddress(
  chainId: number,
  contract: keyof (typeof CONTRACTS)[SupportedChainId]
): `0x${string}` | null {
  const chainContracts = CONTRACTS[chainId as SupportedChainId];
  if (!chainContracts) return null;
  return chainContracts[contract];
}

export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return chainId in CONTRACTS;
}

export function getEIP712Domain(chainId: number, settlementAddress: `0x${string}`) {
  return {
    name: "ERASettlement",
    version: "1",
    chainId,
    verifyingContract: settlementAddress,
  } as const;
}
