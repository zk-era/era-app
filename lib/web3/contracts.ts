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
    // Sepolia Testnet
    settlement: "0xC94179E28c3444e1495812AD3a473bB2C4da69c6" as const,
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
