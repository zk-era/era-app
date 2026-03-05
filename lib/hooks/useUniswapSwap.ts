"use client";

/**
 * Uniswap V2 Swap Hook
 * 
 * Executes swaps directly on Uniswap V2 Router on Sepolia.
 * Follows the same pattern as useERASend with:
 * - Token approval flow
 * - Transaction execution
 * - Toast notifications
 * - Transaction history
 * 
 * Research-backed implementation using proven working contracts:
 * - Router: 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3 (V2)
 * - Pool: USDC/WETH with $2.28M liquidity (verified working)
 * - Pattern: Same as useERASend for consistency
 * 
 * NOTE: This does NOT batch through ERA (yet). For EF grant demo,
 * this shows the UI/UX flow. ERA batching can be added later by:
 * 1. Extending POCSubmitRequest to include swap params
 * 2. Submitting to ERA backend instead of Uniswap directly
 * 
 * @version 2.0.0 (Uniswap V2)
 */

import { useState, useCallback, createElement } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { sileo } from "sileo";
import { parseAbi, maxUint256 } from "viem";
import { isSupportedChain } from "@/lib/web3/contracts";
import { isValidAddress, isValidAmount } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { PulsatingLoader } from "@/components/PulsatingLoader";
import type { Token } from "@/lib/types/swap";

// Uniswap V2 Router address on Sepolia (verified working from tx: 0x539b116d128cb9a4af85ed23c0924d345083a782148f4249f8976f6546365393)
const UNISWAP_V2_ROUTER_SEPOLIA = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

// Minimal ERC20 ABI for allowance and approve
const ERC20_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
]);

// Uniswap V2 Router ABI (swapExactTokensForTokens)
const UNISWAP_V2_ROUTER_ABI = parseAbi([
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[] amounts)",
  "function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)",
]);

export type SwapStatus =
  | "idle"
  | "checking_allowance"
  | "approving"
  | "swapping"
  | "completed"
  | "failed";

// Helper to format error messages for toast display
function formatErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error.length > 80 ? error.slice(0, 80) + "..." : error;
  }
  
  if (error instanceof Error) {
    const message = error.message;
    
    // Handle common error patterns
    if (message.includes("User rejected") || message.includes("user rejected")) {
      return "Transaction rejected";
    }
    if (message.includes("insufficient funds")) {
      return "Insufficient funds";
    }
    if (message.includes("INSUFFICIENT_OUTPUT_AMOUNT")) {
      return "Insufficient output amount (slippage too high)";
    }
    if (message.includes("network")) {
      return "Network error - please try again";
    }
    
    // Truncate long messages
    return message.length > 80 ? message.slice(0, 80) + "..." : message;
  }
  
  return "Swap failed";
}

export interface UseUniswapSwapOptions {
  onComplete?: () => void;
}

export interface SwapResult {
  txHash: string;
  amountOut: string;
  tokenInSymbol: string;
  tokenOutSymbol: string;
  gasUsed: number;
}

export interface UseUniswapSwapResult {
  status: SwapStatus;
  result: SwapResult | null;
  error: string | null;
  swap: (params: {
    tokenIn: Token;
    tokenOut: Token;
    amountIn: number;
    amountOut: number;
    slippagePercent?: number;
    batchSize?: number;
  }) => Promise<void>;
  reset: () => void;
}

export function useUniswapV2Swap(options: UseUniswapSwapOptions = {}): UseUniswapSwapResult {
  const { onComplete } = options;
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<SwapStatus>("idle");
  const [result, setResult] = useState<SwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const swap = useCallback(
    async (params: {
      tokenIn: Token;
      tokenOut: Token;
      amountIn: number;
      amountOut: number;
      slippagePercent?: number;
      batchSize?: number;
    }) => {
      if (!address || !chainId || !publicClient || !walletClient) {
        setError("Wallet not connected");
        setStatus("failed");
        return;
      }

      if (!isSupportedChain(chainId)) {
        setError("Unsupported network. Please switch to Sepolia.");
        setStatus("failed");
        return;
      }

      if (!isValidAddress(params.tokenIn.address) || !isValidAddress(params.tokenOut.address)) {
        setError("Invalid token addresses");
        setStatus("failed");
        return;
      }

      if (!isValidAmount(params.amountIn.toString())) {
        setError("Invalid amount");
        setStatus("failed");
        return;
      }

      try {
        setError(null);

        // Convert amounts to smallest unit
        const tokenInDecimals = params.tokenIn.decimals;
        const tokenOutDecimals = params.tokenOut.decimals;
        
        const amountInWei = BigInt(Math.floor(params.amountIn * 10 ** tokenInDecimals));
        const expectedAmountOutWei = BigInt(Math.floor(params.amountOut * 10 ** tokenOutDecimals));
        
        // Apply slippage tolerance (default 0.5%)
        const slippage = params.slippagePercent ?? 0.5;
        const amountOutMinimum = (expectedAmountOutWei * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);

        logger.debug("Swap", "Params:", {
          tokenIn: params.tokenIn.symbol,
          tokenOut: params.tokenOut.symbol,
          amountInWei: amountInWei.toString(),
          amountOutMinimum: amountOutMinimum.toString(),
          slippage,
        });

        // Step 1: Check token allowance
        setStatus("checking_allowance");
        sileo.info({ 
          title: "Checking allowance...",
          icon: createElement(PulsatingLoader, { color: "#22d3ee" }),
          duration: null,
          styles: { title: "text-[#22d3ee]!" }
        });
        
        const allowance = await publicClient.readContract({
          address: params.tokenIn.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, UNISWAP_V2_ROUTER_SEPOLIA],
        });
        
        logger.debug("SwapV2", "Current allowance:", allowance.toString());

        // Step 2: Request approval if needed
        if (allowance < amountInWei) {
          setStatus("approving");
          sileo.info({ 
            title: "Approve token in wallet...",
            icon: createElement(PulsatingLoader, { color: "#f59e0b" }),
            duration: null,
            styles: { title: "text-[#f59e0b]!" }
          });
          
          logger.debug("SwapV2", "Requesting token approval...");
          
          const hash = await walletClient.writeContract({
            address: params.tokenIn.address as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [UNISWAP_V2_ROUTER_SEPOLIA, maxUint256],
          });
          
          logger.debug("SwapV2", "Approval tx submitted:", hash);
          sileo.info({ 
            title: "Waiting for approval...",
            icon: createElement(PulsatingLoader, { color: "#f59e0b" }),
            duration: null,
            styles: { title: "text-[#f59e0b]!" }
          });
          
          await publicClient.waitForTransactionReceipt({ hash });
          sileo.success({ title: "Token approved", duration: 3000 });
          logger.debug("SwapV2", "Approval confirmed");
        }

        // Step 3: Execute swap (V2 uses path array instead of single pair)
        setStatus("swapping");
        sileo.info({ 
          title: "Executing swap...",
          icon: createElement(PulsatingLoader, { color: "#8b5cf6" }),
          duration: null,
          styles: { title: "text-[#8b5cf6]!" }
        });

        // Uniswap V2 uses path array: [tokenIn, tokenOut]
        const path = [
          params.tokenIn.address as `0x${string}`,
          params.tokenOut.address as `0x${string}`,
        ];
        
        // Deadline: 20 minutes from now
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

        logger.debug("SwapV2", "Executing swap with params:", {
          amountIn: amountInWei.toString(),
          amountOutMin: amountOutMinimum.toString(),
          path,
          deadline: deadline.toString(),
        });

        const swapHash = await walletClient.writeContract({
          address: UNISWAP_V2_ROUTER_SEPOLIA,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: "swapExactTokensForTokens",
          args: [amountInWei, amountOutMinimum, path, address, deadline],
        });

        logger.debug("SwapV2", "Swap tx submitted:", swapHash);
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });
        logger.debug("SwapV2", "Swap confirmed:", receipt);

        // Success!
        const swapResult: SwapResult = {
          txHash: swapHash,
          amountOut: params.amountOut.toFixed(6),
          tokenInSymbol: params.tokenIn.symbol,
          tokenOutSymbol: params.tokenOut.symbol,
          gasUsed: Number(receipt.gasUsed),
        };

        setResult(swapResult);
        setStatus("completed");

        sileo.success({
          title: "Swap successful!",
          description: `Swapped ${params.amountIn.toFixed(6)} ${params.tokenIn.symbol} for ${params.amountOut.toFixed(6)} ${params.tokenOut.symbol}`,
          button: {
            title: "View on Etherscan",
            onClick: () => window.open(`https://sepolia.etherscan.io/tx/${swapHash}`, "_blank"),
          },
          styles: {
            button: "bg-white! text-black! font-semibold!",
          },
          duration: 10000,
        });

        // Call onComplete callback to reset form
        onComplete?.();

      } catch (err) {
        const fullError = err instanceof Error ? err.message : "Unknown error";
        const displayError = formatErrorMessage(err);
        logger.error("SwapV2", "Error:", err);
        setError(fullError);
        setStatus("failed");
        sileo.error({ 
          title: displayError,
          button: {
            title: "Copy Error",
            onClick: () => {
              navigator.clipboard.writeText(fullError).then(() => {
                sileo.success({ title: "Error copied to clipboard", duration: 2000 });
              }).catch(() => {
                sileo.error({ title: "Failed to copy", duration: 2000 });
              });
            }
          }
        });
      }
    },
    [address, chainId, publicClient, walletClient, onComplete]
  );

  return {
    status,
    result,
    error,
    swap,
    reset,
  };
}
