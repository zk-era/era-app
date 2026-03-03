"use client";

import { useState, useCallback, createElement } from "react";
import { useAccount, useSignTypedData, usePublicClient, useWalletClient } from "wagmi";
import { useChainInfo } from "@/lib/context/ChainContext";
import { sileo } from "sileo";
import { eraApi, POCJobStatus, POCResult } from "@/lib/api/era";
import { parseAbi, maxUint256 } from "viem";
import { getContractAddress, getEIP712Domain, isSupportedChain } from "@/lib/web3/contracts";
import { isValidAddress, isValidAmount } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";
import { ResultToast } from "@/components/send/ResultToast";
import { useTransactionHistory } from "@/lib/hooks/useTransactionHistory";
import { PulsatingLoader } from "@/components/PulsatingLoader";

// Minimal ERC20 ABI for allowance and approve
const ERC20_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// TransferIntent type for EIP-712 signing
const TRANSFER_INTENT_TYPES = {
  TransferIntent: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export type SendStatus =
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
  
  return "Transaction failed";
}

export interface UseERASendOptions {
  onComplete?: () => void;
}

export interface UseERASendResult {
  status: SendStatus;
  jobStatus: POCJobStatus | null;
  result: POCResult | null;
  error: string | null;
  send: (params: {
    to: string;
    token: string;
    tokenSymbol: string;
    tokenLogo?: string;
    amount: string;
    usdValue: string;
    decimals: number;
    batchSize?: number;
  }) => Promise<void>;
  reset: () => void;
}

export function useERASend(options: UseERASendOptions = {}): UseERASendResult {
  const { onComplete } = options;
  const { address, chainId } = useAccount();
  const { chainIcon, chainName } = useChainInfo();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { addTransaction } = useTransactionHistory();

  const [status, setStatus] = useState<SendStatus>("idle");
  const [jobStatus, setJobStatus] = useState<POCJobStatus | null>(null);
  const [result, setResult] = useState<POCResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setJobStatus(null);
    setResult(null);
    setError(null);
  }, []);

  const send = useCallback(
    async (params: {
      to: string;
      token: string;
      tokenSymbol: string;
      tokenLogo?: string;
      amount: string;
      usdValue: string;
      decimals: number;
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

      if (!isValidAddress(params.to)) {
        setError("Invalid recipient address");
        setStatus("failed");
        return;
      }

      if (!isValidAmount(params.amount)) {
        setError("Invalid amount");
        setStatus("failed");
        return;
      }

      try {
        setError(null);

        // Convert amount to smallest unit (e.g., USDC has 6 decimals)
        logger.debug("ERA", "Input amount:", params.amount, "decimals:", params.decimals);
        const [whole, fraction = ""] = params.amount.split(".");
        const paddedFraction = fraction.padEnd(params.decimals, "0").slice(0, params.decimals);
        const amountInSmallestUnit = BigInt(whole + paddedFraction);
        logger.debug("ERA", "Converted to smallest unit:", amountInSmallestUnit.toString());

        // Step 1: Check token allowance
        setStatus("checking_allowance");
        sileo.info({ 
          title: "Checking allowance...",
          icon: createElement(PulsatingLoader, { color: "#22d3ee" }), // Cyan - checking/info
          duration: null, // Stay visible
          styles: {
            title: "text-[#22d3ee]!" // Match animation color
          }
        });
        
        const allowance = await publicClient.readContract({
          address: params.token as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, settlementAddress],
        });
        logger.debug("ERA", "Current allowance:", allowance.toString());

        // Step 2: Request approval if needed
        if (allowance < amountInSmallestUnit) {
          setStatus("approving");
          sileo.info({ 
            title: "Approve token in wallet...",
            icon: createElement(PulsatingLoader, { color: "#f59e0b" }), // Amber - action needed, costs gas
            duration: null, // Stay visible
            styles: {
              title: "text-[#f59e0b]!" // Match animation color
            }
          });
          logger.debug("ERA", "Requesting token approval...");
          
          const hash = await walletClient.writeContract({
            address: params.token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [settlementAddress, maxUint256],
          });
          
          logger.debug("ERA", "Approval tx submitted:", hash);
          sileo.info({ 
            title: "Waiting for approval confirmation...",
            icon: createElement(PulsatingLoader, { color: "#f59e0b" }), // Amber - still waiting for approval
            duration: null, // Stay visible
            styles: {
              title: "text-[#f59e0b]!" // Match animation color
            }
          });
          await publicClient.waitForTransactionReceipt({ hash });
          sileo.success({ 
            title: "Token approved",
            duration: 3000 // Brief confirmation, then continue
          });
          logger.debug("ERA", "Approval confirmed");
        }

        // Step 3: Get nonce from backend/contract
        setStatus("signing");
        const nonce = await eraApi.getNonce(address);
        logger.debug("ERA", "Current nonce:", nonce);

        // Step 4: Sign EIP-712 typed data
        sileo.info({ 
          title: "Sign transaction in wallet...",
          icon: createElement(PulsatingLoader, { color: "#f59e0b" }), // Amber - action needed
          duration: null, // Stay visible until next stage
          styles: {
            title: "text-[#f59e0b]!" // Match animation color
          }
        });
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
        const eip712Domain = getEIP712Domain(chainId, settlementAddress);
        const transferIntent = {
          from: address,
          to: params.to as `0x${string}`,
          token: params.token as `0x${string}`,
          amount: amountInSmallestUnit,
          nonce: BigInt(nonce),
          deadline,
        };

        logger.debug("ERA", "Signing transfer intent:", transferIntent);
        const signature = await signTypedDataAsync({
          domain: eip712Domain,
          types: TRANSFER_INTENT_TYPES,
          primaryType: "TransferIntent",
          message: transferIntent,
        });
        logger.debug("ERA", "Signature obtained");

        // Step 5: Submit to ERA backend (include the exact values we signed)
        setStatus("submitting");
        sileo.info({ 
          title: "Submitting to ERA...",
          icon: createElement(PulsatingLoader, { color: "#a78bfa" }), // Purple - sending signed data
          duration: null, // Stay visible
          styles: {
            title: "text-[#a78bfa]!" // Match animation color
          }
        });
        const submitResponse = await eraApi.submitTransaction({
          from: address,
          to: params.to,
          token: params.token,
          amount: amountInSmallestUnit.toString(),
          signature,
          chainId,
          nonce,
          deadline: Number(deadline),
          batchSize: params.batchSize ?? 20,
        });

        // Step 6: Poll for status updates
        setStatus("processing");
        sileo.info({ 
          title: "Processing batch...",
          icon: createElement(PulsatingLoader, { color: "#8b5cf6" }), // Violet - computation
          duration: null, // Stay visible
          styles: {
            title: "text-[#8b5cf6]!" // Match animation color
          }
        });
        
        const finalStatus = await eraApi.pollJobStatus(
          submitResponse.jobId,
          (jobStatus) => {
            setJobStatus(jobStatus);
            // Update toast based on job status
            if (jobStatus.status === "generating_proof") {
              sileo.info({ 
                title: "Generating ZK proof...",
                icon: createElement(PulsatingLoader, { color: "#ec4899" }), // Pink - intense cryptographic work
                duration: null, // Stay visible
                styles: {
                  title: "text-[#ec4899]!" // Match animation color
                }
              });
            } else if (jobStatus.status === "settling") {
              sileo.info({ 
                title: "Settling on-chain...",
                icon: createElement(PulsatingLoader, { color: "#10b981" }), // Emerald - final step, going to L1!
                duration: null, // Stay visible
                styles: {
                  title: "text-[#10b981]!" // Match animation color
                }
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
            tokenSymbol: params.tokenSymbol,
            tokenLogo: params.tokenLogo,
            amount: params.amount,
            usdValue: params.usdValue,
            recipient: params.to,
            sender: address,
            chainName: chainName || "Ethereum",
            chainIcon: chainIcon,
            result: txResult,
          });

          sileo.success({
            title: "Transaction Settled!",
            description: createElement(ResultToast, {
              tokenSymbol: params.tokenSymbol,
              tokenLogo: params.tokenLogo,
              amount: params.amount,
              usdValue: params.usdValue,
              recipient: params.to,
              sender: address,
              networkFee: gasComparison.eraCostUsd,
              chainName: chainName || "Ethereum",
              chainIcon: chainIcon,
            }),
            button: {
              title: "View Details",
              onClick: () => window.location.assign(`/send/result/${submitResponse.jobId}`),
            },
            styles: {
              button: "bg-white! text-black! font-semibold!",
            },
            duration: 10000, // Auto-dismiss after 10 seconds
          });
          // Call onComplete callback to reset form
          onComplete?.();
        } else {
          const fullError = finalStatus.error || "Transaction failed";
          const errorMsg = formatErrorMessage(fullError);
          setError(fullError);
          setStatus("failed");
          sileo.error({ 
            title: errorMsg,
            button: {
              title: "Copy Error",
              onClick: () => {
                navigator.clipboard.writeText(fullError).then(() => {
                  sileo.success({ 
                    title: "Error copied to clipboard",
                    duration: 2000 
                  });
                }).catch(() => {
                  sileo.error({ 
                    title: "Failed to copy",
                    duration: 2000 
                  });
                });
              }
            }
          });
        }
      } catch (err) {
        const fullError = err instanceof Error ? err.message : "Unknown error";
        const displayError = formatErrorMessage(err);
        logger.error("ERA", "Error:", err);
        setError(fullError);
        setStatus("failed");
        sileo.error({ 
          title: displayError,
          button: {
            title: "Copy Error",
            onClick: () => {
              navigator.clipboard.writeText(fullError).then(() => {
                sileo.success({ 
                  title: "Error copied to clipboard",
                  duration: 2000 
                });
              }).catch(() => {
                sileo.error({ 
                  title: "Failed to copy",
                  duration: 2000 
                });
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
    send,
    reset,
  };
}
