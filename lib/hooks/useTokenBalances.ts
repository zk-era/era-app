"use client";

import { useAccount, useBalance, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { SEPOLIA_TOKENS } from "@/lib/constants/tokens";
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

export function useTokenBalances() {
  const { address, isConnected } = useAccount();

  // Fetch native ETH balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled: isConnected && !!address },
  });

  // Fetch ERC-20 balances (USDC, EURC)
  const { data: tokenBalances, isLoading: tokensLoading } = useReadContracts({
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
    ],
    query: { enabled: isConnected && !!address },
  });

  // Build tokens with real balances
  const tokens: Token[] = [];

  if (tokenBalances) {
    // USDC
    if (tokenBalances[0]?.status === "success") {
      const balance = Number(
        formatUnits(tokenBalances[0].result as bigint, SEPOLIA_TOKENS.USDC.decimals)
      );
      if (balance > 0) {
        tokens.push({
          ...SEPOLIA_TOKENS.USDC,
          balance,
          price: 1.0,
        });
      }
    }

    // EURC
    if (tokenBalances[1]?.status === "success") {
      const balance = Number(
        formatUnits(tokenBalances[1].result as bigint, SEPOLIA_TOKENS.EURC.decimals)
      );
      if (balance > 0) {
        tokens.push({
          ...SEPOLIA_TOKENS.EURC,
          balance,
          price: 1.08,
        });
      }
    }
  }

  return {
    tokens,
    ethBalance: ethBalance
      ? {
          value: ethBalance.value,
          formatted: ethBalance.formatted,
          symbol: ethBalance.symbol,
        }
      : null,
    isLoading: ethLoading || tokensLoading,
    isConnected,
  };
}
