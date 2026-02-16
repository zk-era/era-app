"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignTypedData, usePublicClient, useWalletClient } from "wagmi";
import { eraApi, POCJobStatus, POCResult } from "@/lib/api/era";
import { parseAbi, maxUint256 } from "viem";
import { getContractAddress, getEIP712Domain, isSupportedChain } from "@/lib/web3/contracts";
import { isValidAddress, isValidAmount } from "@/lib/utils/validation";
import { logger } from "@/lib/utils/logger";

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

export interface UseERASendResult {
  status: SendStatus;
  jobStatus: POCJobStatus | null;
  result: POCResult | null;
  error: string | null;
  send: (params: {
    to: string;
    token: string;
    amount: string;
    decimals: number;
    batchSize?: number;
  }) => Promise<void>;
  reset: () => void;
}

export function useERASend(): UseERASendResult {
  const { address, chainId } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

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
      amount: string;
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
          logger.debug("ERA", "Requesting token approval...");
          
          const hash = await walletClient.writeContract({
            address: params.token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [settlementAddress, maxUint256],
          });
          
          logger.debug("ERA", "Approval tx submitted:", hash);
          await publicClient.waitForTransactionReceipt({ hash });
          logger.debug("ERA", "Approval confirmed");
        }

        // Step 3: Get nonce from backend/contract
        setStatus("signing");
        const nonce = await eraApi.getNonce(address);
        logger.debug("ERA", "Current nonce:", nonce);

        // Step 4: Sign EIP-712 typed data
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
        const finalStatus = await eraApi.pollJobStatus(
          submitResponse.jobId,
          (status) => {
            setJobStatus(status);
          }
        );

        if (finalStatus.status === "completed" && finalStatus.result) {
          setResult(finalStatus.result);
          setStatus("completed");
        } else {
          setError(finalStatus.error || "Transaction failed");
          setStatus("failed");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        logger.error("ERA", "Error:", err);
        setError(errorMessage);
        setStatus("failed");
      }
    },
    [address, chainId, publicClient, walletClient, signTypedDataAsync]
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
