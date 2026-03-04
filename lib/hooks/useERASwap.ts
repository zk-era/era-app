"use client";

/**
 * ERA Swap Hook - Swap batching through ERA Protocol
 * 
 * This hook follows the exact same pattern as useERASend:
 * 1. Check token approval for Uniswap V2 router
 * 2. Sign SwapIntent (EIP-712 off-chain signature)
 * 3. Submit to ERA backend for batching
 * 4. Poll for batch completion
 * 5. Get 77-95% gas savings
 * 
 * @version 1.0.0
 * @pattern Mirrors useERASend.ts exactly
 */

import { useState, useCallback, createElement } from "react";
import { useAccount, useSignTypedData, usePublicClient, useWalletClient } from "wagmi";
import { useChainInfo } from "@/lib/context/ChainContext";
import { sileo } from "sileo";
import { eraApi, POCJobStatus, POCResult } from "@/lib/api/era";
import { parseAbi, maxUint256, parseUnits } from "viem";
import { getContractAddress, isSupportedChain } from "@/lib/web3/contracts";
import { isValidAddress, isValidAmount } from "@/lib/utils/validation";
import { useTransactionHistory } from "@/lib/hooks/useTransactionHistory";
import { PulsatingLoader } from "@/components/PulsatingLoader";

// Minimal ERC20 ABI for allowance and approve
const ERC20_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// Uniswap V2 Router ABI for quotes
const UNISWAP_V2_ROUTER_ABI = parseAbi([
  "function getAmountsOut(uint256 amountIn, address[] path) external view returns (uint256[] amounts)",
]);

// Uniswap V2 Router on Sepolia (verified working)
const UNISWAP_V2_ROUTER_SEPOLIA = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

// SwapIntent type for EIP-712 signing
const SWAP_INTENT_TYPES = {
  SwapIntent: [
    { name: "from", type: "address" },
    { name: "tokenIn", type: "address" },
    { name: "tokenOut", type: "address" },
    { name: "amountIn", type: "uint256" },
    { name: "amountOutMin", type: "uint256" },
    { name: "recipient", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export type SwapStatus =
  | "idle"
  | "checking_allowance"
  | "approving"
  | "signing"
  | "submitting"
  | "processing"
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
    if (message.includes("network")) {
      return "Network error - please try again";
    }
    
    // Truncate long messages
    return message.length > 80 ? message.slice(0, 80) + "..." : message;
  }
  
  return "Swap failed";
}

export interface UseERASwapOptions {
  onComplete?: () => void;
}

export interface UseERASwapResult {
  status: SwapStatus;
  jobStatus: POCJobStatus | null;
  result: POCResult | null;
  error: string | null;
  swap: (params: {
    tokenIn: string;
    tokenInSymbol: string;
    tokenInDecimals: number;
    tokenOut: string;
    tokenOutSymbol: string;
    tokenOutDecimals: number;
    amountIn: string;
    slippagePercent?: number;
    batchSize?: number;
  }) => Promise<void>;
  reset: () => void;
}

export function useERASwap(options: UseERASwapOptions = {}): UseERASwapResult {
  const { onComplete } = options;
  const { address, chainId } = useAccount();
  const { chainIcon, chainName } = useChainInfo();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { addTransaction } = useTransactionHistory();

  const [status, setStatus] = useState<SwapStatus>("idle");
  const [jobStatus, setJobStatus] = useState<POCJobStatus | null>(null);
  const [result, setResult] = useState<POCResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setJobStatus(null);
    setResult(null);
    setError(null);
  }, []);

  const swap = useCallback(
    async (params: {
      tokenIn: string;
      tokenInSymbol: string;
      tokenInDecimals: number;
      tokenOut: string;
      tokenOutSymbol: string;
      tokenOutDecimals: number;
      amountIn: string;
      slippagePercent?: number;
      batchSize?: number;
    }) => {
      if (!address || !chainId || !publicClient || !walletClient) {
        setError("Wallet not connected");
        setStatus("failed");
        return;
      }

      if (!isSupportedChain(chainId)) {
        setError("Unsupported network. Please switch to a supported chain.");
        setStatus("failed");
        return;
      }

      const settlementAddress = getContractAddress(chainId, "settlement");
      if (!settlementAddress) {
        setError("Settlement contract not configured for this network");
        setStatus("failed");
        return;
      }

      if (!isValidAddress(params.tokenIn) || !isValidAddress(params.tokenOut)) {
        setError("Invalid token address");
        setStatus("failed");
        return;
      }

      if (!isValidAmount(params.amountIn)) {
        setError("Invalid amount");
        setStatus("failed");
        return;
      }

      try {
        setError(null);

        // Convert amount to smallest unit
        const amountInWei = parseUnits(params.amountIn, params.tokenInDecimals);

        // Get expected output from Uniswap V2 pool
        const path = [params.tokenIn as `0x${string}`, params.tokenOut as `0x${string}`];
        const amounts = await publicClient.readContract({
          address: UNISWAP_V2_ROUTER_SEPOLIA,
          abi: UNISWAP_V2_ROUTER_ABI,
          functionName: "getAmountsOut",
          args: [amountInWei, path],
        });

        const expectedAmountOutWei = amounts[1];

        // Apply slippage tolerance (default 0.5%)
        const slippage = params.slippagePercent ?? 0.5;
        const amountOutMinimum = (expectedAmountOutWei * BigInt(Math.floor((100 - slippage) * 100))) / BigInt(10000);

        // Step 1: Check token approval for ERASettlement contract
        setStatus("checking_allowance");
        sileo.info({ 
          title: "Checking allowance...",
          icon: createElement(PulsatingLoader, { color: "#22d3ee" }),
          duration: null,
          styles: { title: "text-[#22d3ee]!" }
        });
        
        const allowance = await publicClient.readContract({
          address: params.tokenIn as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, settlementAddress], // Check ERA contract approval
        });

        // Step 2: Request approval if needed (approve ERASettlement contract, not Uniswap!)
        if (allowance < amountInWei) {
          setStatus("approving");
          sileo.info({ 
            title: "Approve token in wallet...",
            icon: createElement(PulsatingLoader, { color: "#f59e0b" }),
            duration: null,
            styles: { title: "text-[#f59e0b]!" }
          });
          
          const hash = await walletClient.writeContract({
            address: params.tokenIn as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [settlementAddress, maxUint256], // Approve ERA contract, not Uniswap!
          });
          
          sileo.info({ 
            title: "Waiting for approval confirmation...",
            icon: createElement(PulsatingLoader, { color: "#f59e0b" }),
            duration: null,
            styles: { title: "text-[#f59e0b]!" }
          });
          await publicClient.waitForTransactionReceipt({ hash });
          sileo.success({ 
            title: "Token approved",
            duration: 3000
          });
        }

        // Step 3: Get nonce from backend
        setStatus("signing");
        const nonce = await eraApi.getNonce(address);

        // Step 4: Sign SwapIntent (EIP-712 typed data)
        sileo.info({ 
          title: "Sign swap in wallet...",
          icon: createElement(PulsatingLoader, { color: "#f59e0b" }),
          duration: null,
          styles: { title: "text-[#f59e0b]!" }
        });
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
        const swapIntent = {
          from: address,
          tokenIn: params.tokenIn as `0x${string}`,
          tokenOut: params.tokenOut as `0x${string}`,
          amountIn: amountInWei,
          amountOutMin: amountOutMinimum,
          recipient: address,
          nonce: BigInt(nonce),
          deadline,
        };
        
        const signature = await signTypedDataAsync({
          domain: {
            name: "ERA Protocol",
            version: "1",
            chainId: BigInt(chainId),
            verifyingContract: settlementAddress,
          },
          types: SWAP_INTENT_TYPES,
          primaryType: "SwapIntent",
          message: swapIntent,
        });
        

        // Step 5: Submit to ERA backend
        setStatus("submitting");
        sileo.info({ 
          title: "Submitting to ERA...",
          icon: createElement(PulsatingLoader, { color: "#a78bfa" }),
          duration: null,
          styles: { title: "text-[#a78bfa]!" }
        });
        
        const submitResponse = await eraApi.submitTransaction({
          from: address,
          to: address, // Recipient (same as sender for swaps)
          token: params.tokenIn,
          amount: amountInWei.toString(),
          signature,
          chainId,
          nonce,
          deadline: Number(deadline),
          batchSize: params.batchSize ?? 20,
          // Swap-specific fields
          tokenOut: params.tokenOut,
          amountOutMin: amountOutMinimum.toString(),
          swapRouter: UNISWAP_V2_ROUTER_SEPOLIA,
        });

        // Step 6: Poll for status updates
        setStatus("processing");
        sileo.info({ 
          title: "Processing batch...",
          icon: createElement(PulsatingLoader, { color: "#8b5cf6" }),
          duration: null,
          styles: { title: "text-[#8b5cf6]!" }
        });
        
        const finalStatus = await eraApi.pollJobStatus(
          submitResponse.jobId,
          (jobStatus) => {
            setJobStatus(jobStatus);
            if (jobStatus.status === "generating_proof") {
              sileo.info({ 
                title: "Generating ZK proof...",
                icon: createElement(PulsatingLoader, { color: "#ec4899" }),
                duration: null,
                styles: { title: "text-[#ec4899]!" }
              });
            } else if (jobStatus.status === "settling") {
              sileo.info({ 
                title: "Settling on-chain...",
                icon: createElement(PulsatingLoader, { color: "#10b981" }),
                duration: null,
                styles: { title: "text-[#10b981]!" }
              });
            }
          }
        );

        if (finalStatus.status === "completed" && finalStatus.result) {
          const txResult = finalStatus.result;
          const { gasComparison } = txResult;
          setResult(txResult);
          setStatus("completed");

          // Store transaction in history
          addTransaction({
            jobId: submitResponse.jobId,
            tokenSymbol: `${params.tokenInSymbol} → ${params.tokenOutSymbol}`,
            amount: params.amountIn,
            usdValue: "0", // Calculate if needed
            recipient: address,
            sender: address,
            chainName: chainName || "Ethereum",
            chainIcon: chainIcon,
            result: txResult,
          });

          sileo.success({
            title: "Swap Settled!",
            description: `Swapped ${params.amountIn} ${params.tokenInSymbol} → ${params.tokenOutSymbol}. Saved ${gasComparison.savingsPercent}% on gas!`,
            button: {
              title: "View on Etherscan",
              onClick: () => window.open(txResult.etherscanUrl, "_blank"),
            },
            styles: {
              button: "bg-white! text-black! font-semibold!",
            },
            duration: 10000,
          });
          onComplete?.();
        } else {
          const fullError = finalStatus.error || "Swap failed";
          const errorMsg = formatErrorMessage(fullError);
          setError(fullError);
          setStatus("failed");
          sileo.error({ 
            title: errorMsg,
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
      } catch (err) {
        const fullError = err instanceof Error ? err.message : "Unknown error";
        const displayError = formatErrorMessage(err);
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
    [address, chainId, chainIcon, chainName, publicClient, walletClient, signTypedDataAsync, addTransaction, onComplete]
  );

  return {
    status,
    jobStatus,
    result,
    error,
    swap,
    reset,
  };
}
