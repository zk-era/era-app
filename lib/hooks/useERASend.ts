"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { eraApi, POCJobStatus, POCResult } from "@/lib/api/era";

export type SendStatus =
  | "idle"
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
  const { signMessageAsync } = useSignMessage();

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
      if (!address || !chainId) {
        setError("Wallet not connected");
        setStatus("failed");
        return;
      }

      try {
        setStatus("signing");
        setError(null);

        // Convert amount to smallest unit (e.g., USDC has 6 decimals)
        const amountInSmallestUnit = BigInt(
          Math.floor(parseFloat(params.amount) * 10 ** params.decimals)
        ).toString();

        // Create message to sign
        const message = JSON.stringify({
          action: "era_transfer",
          from: address,
          to: params.to,
          token: params.token,
          amount: amountInSmallestUnit,
          chainId,
          timestamp: Date.now(),
        });

        // Sign the message
        const signature = await signMessageAsync({ message });

        setStatus("submitting");

        // Submit to ERA backend
        const submitResponse = await eraApi.submitTransaction({
          from: address,
          to: params.to,
          token: params.token,
          amount: amountInSmallestUnit,
          signature,
          chainId,
        });

        setStatus("processing");

        // Poll for status updates
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
        setError(errorMessage);
        setStatus("failed");
      }
    },
    [address, chainId, signMessageAsync]
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
