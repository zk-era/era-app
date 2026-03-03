"use client";

import { useAccount, useBalance, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { SEPOLIA_TOKENS } from "@/lib/constants/tokens";
import { getTokenBalancesWithMetadata } from "@/lib/utils/alchemy";
import type { Token } from "@/lib/types/swap";

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Whitelist of tokens ERA backend supports
// Only show these tokens even if user has others
const SUPPORTED_TOKEN_ADDRESSES = new Set(
  Object.values(SEPOLIA_TOKENS)
    .filter((token) => token.address !== "0x0000000000000000000000000000000000000000")
    .map((token) => token.address.toLowerCase())
);

export function useTokenBalances() {
  const { address, isConnected } = useAccount();

  // Fetch native ETH balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled: isConnected && !!address },
  });

  // Fallback: Manual token balance checking (for testnet reliability)
  const { data: manualBalances, isLoading: manualLoading } = useReadContracts({
    contracts: [
      {
        address: SEPOLIA_TOKENS.USDC.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address!],
        chainId: sepolia.id,
      },
      {
        address: SEPOLIA_TOKENS.EURC.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address!],
        chainId: sepolia.id,
      },
      {
        address: SEPOLIA_TOKENS.PYUSD.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address!],
        chainId: sepolia.id,
      },
    ],
    query: { enabled: isConnected && !!address },
  });

  // Build tokens array - use manual balance checking for testnet reliability
  const tokens: Token[] = [];

  if (manualBalances) {
    console.log("[TokenBalances] Manual balance check results:", manualBalances);
    
    // USDC
    if (manualBalances[0]?.status === "success") {
      const balance = Number(
        formatUnits(manualBalances[0].result as bigint, SEPOLIA_TOKENS.USDC.decimals)
      );
      console.log("[TokenBalances] USDC balance:", balance);
      if (balance > 0) {
        tokens.push({
          ...SEPOLIA_TOKENS.USDC,
          balance,
          price: 1.0,
        });
      }
    } else {
      console.error("[TokenBalances] USDC balance check failed:", manualBalances[0]);
    }

    // EURC
    if (manualBalances[1]?.status === "success") {
      const balance = Number(
        formatUnits(manualBalances[1].result as bigint, SEPOLIA_TOKENS.EURC.decimals)
      );
      console.log("[TokenBalances] EURC balance:", balance);
      if (balance > 0) {
        tokens.push({
          ...SEPOLIA_TOKENS.EURC,
          balance,
          price: 1.18, // 1 USDC = 0.85 EURC → 1 EURC = ~$1.18 (as of Mar 2, 2026)
        });
      }
    } else {
      console.error("[TokenBalances] EURC balance check failed:", manualBalances[1]);
    }

    // PYUSD
    if (manualBalances[2]?.status === "success") {
      const balance = Number(
        formatUnits(manualBalances[2].result as bigint, SEPOLIA_TOKENS.PYUSD.decimals)
      );
      console.log("[TokenBalances] PYUSD balance:", balance);
      if (balance > 0) {
        tokens.push({
          ...SEPOLIA_TOKENS.PYUSD,
          balance,
          price: 1.0,
        });
      }
    } else {
      console.error("[TokenBalances] PYUSD balance check failed:", manualBalances[2]);
    }
  }
  
  console.log("[TokenBalances] Final tokens array:", tokens);

  return {
    tokens,
    ethBalance: ethBalance
      ? {
          value: ethBalance.value,
          formatted: ethBalance.formatted,
          symbol: ethBalance.symbol,
        }
      : null,
    isLoading: ethLoading || manualLoading,
    isConnected,
  };
}
