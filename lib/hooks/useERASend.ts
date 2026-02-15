"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignTypedData, usePublicClient, useWalletClient } from "wagmi";
import { eraApi, POCJobStatus, POCResult } from "@/lib/api/era";
import { parseAbi, encodeFunctionData, maxUint256 } from "viem";

// ERASettlement contract address on Sepolia (with executeVerifiedTransfer)
const ERA_SETTLEMENT_ADDRESS = "0xC94179E28c3444e1495812AD3a473bB2C4da69c6";

// Minimal ERC20 ABI for allowance and approve
const ERC20_ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// EIP-712 Domain for ERASettlement
const EIP712_DOMAIN = {
  name: "ERASettlement",
  version: "1",
  chainId: 11155111, // Sepolia
  verifyingContract: ERA_SETTLEMENT_ADDRESS,
} as const;

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
    }) => {
      if (!address || !chainId || !publicClient || !walletClient) {
        setError("Wallet not connected");
        setStatus("failed");
        return;
      }

      try {
        setError(null);

        // Convert amount to smallest unit (e.g., USDC has 6 decimals)
        console.log("[ERA] Input amount:", params.amount, "decimals:", params.decimals);
        const [whole, fraction = ""] = params.amount.split(".");
        const paddedFraction = fraction.padEnd(params.decimals, "0").slice(0, params.decimals);
        const amountInSmallestUnit = BigInt(whole + paddedFraction);
        console.log("[ERA] Converted to smallest unit:", amountInSmallestUnit.toString());

        // Step 1: Check token allowance
        setStatus("checking_allowance");
        const allowance = await publicClient.readContract({
          address: params.token as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, ERA_SETTLEMENT_ADDRESS],
        });
        console.log("[ERA] Current allowance:", allowance.toString());

        // Step 2: Request approval if needed
        if (allowance < amountInSmallestUnit) {
          setStatus("approving");
          console.log("[ERA] Requesting token approval...");
          
          const hash = await walletClient.writeContract({
            address: params.token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [ERA_SETTLEMENT_ADDRESS, maxUint256],
          });
          
          console.log("[ERA] Approval tx submitted:", hash);
          await publicClient.waitForTransactionReceipt({ hash });
          console.log("[ERA] Approval confirmed");
        }

        // Step 3: Get nonce from backend/contract
        setStatus("signing");
        const nonce = await eraApi.getNonce(address);
        console.log("[ERA] Current nonce:", nonce);

        // Step 4: Sign EIP-712 typed data
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
        const transferIntent = {
          from: address,
          to: params.to as `0x${string}`,
          token: params.token as `0x${string}`,
          amount: amountInSmallestUnit,
          nonce: BigInt(nonce),
          deadline,
        };

        console.log("[ERA] Signing transfer intent:", transferIntent);
        const signature = await signTypedDataAsync({
          domain: EIP712_DOMAIN,
          types: TRANSFER_INTENT_TYPES,
          primaryType: "TransferIntent",
          message: transferIntent,
        });
        console.log("[ERA] Signature obtained");

        // Step 5: Submit to ERA backend
        setStatus("submitting");
        const submitResponse = await eraApi.submitTransaction({
          from: address,
          to: params.to,
          token: params.token,
          amount: amountInSmallestUnit.toString(),
          signature,
          chainId,
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
        console.error("[ERA] Error:", err);
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
