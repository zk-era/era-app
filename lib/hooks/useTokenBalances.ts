"use client";

import { useAccount, useBalance, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { sepolia } from "wagmi/chains";
import { SEPOLIA_TOKENS } from "@/lib/constants/tokens";
import { logger } from "@/lib/utils/logger";
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

  // Fallback: Manual token balance checking (for testnet reliability)
  const { data: manualBalances, isLoading: manualLoading } = useReadContracts({
    contracts: [
      {
        address: SEPOLIA_TOKENS.WETH.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address!],
        chainId: sepolia.id,
      },
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
  // IMPORTANT: Show ALL tokens regardless of balance (for swap UI)
  const tokens: Token[] = [];

  if (manualBalances) {
    // WETH
    if (manualBalances[0]?.status === "success") {
      const balance = Number(
        formatUnits(manualBalances[0].result as bigint, SEPOLIA_TOKENS.WETH.decimals)
      );
      tokens.push({
        ...SEPOLIA_TOKENS.WETH,
        balance,
        price: 2500, // ETH price estimate
      });
    } else {
      logger.error("TokenBalances", "WETH balance check failed:", manualBalances[0]);
      tokens.push({
        ...SEPOLIA_TOKENS.WETH,
        balance: 0,
        price: 2500,
      });
    }
    
    // USDC
    if (manualBalances[1]?.status === "success") {
      const balance = Number(
        formatUnits(manualBalances[1].result as bigint, SEPOLIA_TOKENS.USDC.decimals)
      );
      tokens.push({
        ...SEPOLIA_TOKENS.USDC,
        balance,
        price: 1.0,
      });
    } else {
      logger.error("TokenBalances", "USDC balance check failed:", manualBalances[1]);
      // Still add token with 0 balance for swap UI
      tokens.push({
        ...SEPOLIA_TOKENS.USDC,
        balance: 0,
        price: 1.0,
      });
    }

    // EURC
    if (manualBalances[2]?.status === "success") {
      const balance = Number(
        formatUnits(manualBalances[2].result as bigint, SEPOLIA_TOKENS.EURC.decimals)
      );
      tokens.push({
        ...SEPOLIA_TOKENS.EURC,
        balance,
        price: 1.18, // 1 USDC = 0.85 EURC → 1 EURC = ~$1.18 (as of Mar 2, 2026)
      });
    } else {
      logger.error("TokenBalances", "EURC balance check failed:", manualBalances[2]);
      // Still add token with 0 balance for swap UI
      tokens.push({
        ...SEPOLIA_TOKENS.EURC,
        balance: 0,
        price: 1.18,
      });
    }

    // PYUSD
    if (manualBalances[3]?.status === "success") {
      const balance = Number(
        formatUnits(manualBalances[3].result as bigint, SEPOLIA_TOKENS.PYUSD.decimals)
      );
      tokens.push({
        ...SEPOLIA_TOKENS.PYUSD,
        balance,
        price: 1.0,
      });
    } else {
      logger.error("TokenBalances", "PYUSD balance check failed:", manualBalances[3]);
      // Still add token with 0 balance for swap UI
      tokens.push({
        ...SEPOLIA_TOKENS.PYUSD,
        balance: 0,
        price: 1.0,
      });
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
    isLoading: ethLoading || manualLoading,
    isConnected,
  };
}
