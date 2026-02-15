"use client";

import { motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import type { POCJobStatus } from "@/lib/api/era";
import type { SendStatus } from "@/lib/hooks/useERASend";

interface StatusStepProps {
  sendStatus: SendStatus;
  jobStatus: POCJobStatus | null;
  error: string | null;
  onRetry: () => void;
}

const STEPS = [
  { key: "signing", label: "Signing transaction" },
  { key: "submitting", label: "Submitting to ERA" },
  { key: "fetching_padding", label: "Fetching batch transactions" },
  { key: "building_batch", label: "Building batch" },
  { key: "generating_proof", label: "Generating zkSTARK proof" },
  { key: "settling", label: "Settling on Sepolia" },
] as const;

function getActiveStepIndex(sendStatus: SendStatus, jobStatus: POCJobStatus | null): number {
  if (sendStatus === "signing") return 0;
  if (sendStatus === "submitting") return 1;
  if (!jobStatus) return 1;

  switch (jobStatus.status) {
    case "pending":
      return 1;
    case "fetching_padding":
      return 2;
    case "building_batch":
      return 3;
    case "generating_proof":
      return 4;
    case "settling":
      return 5;
    default:
      return 5;
  }
}

export function StatusStep({ sendStatus, jobStatus, error, onRetry }: StatusStepProps) {
  const activeIndex = getActiveStepIndex(sendStatus, jobStatus);
  const isFailed = sendStatus === "failed";
  const progress = jobStatus?.progress ?? (activeIndex / STEPS.length) * 100;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">
          {isFailed ? "Transaction Failed" : "Processing"}
        </h1>
        <Link
          href="/"
          className="rounded-lg p-1 transition-colors hover:bg-[#1a1a1a]"
        >
          <X className="size-5 text-[#7b7b7b]" />
        </Link>
      </div>

      {!isFailed && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#7b7b7b]">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {STEPS.map((step, index) => {
          const isActive = index === activeIndex && !isFailed;
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                isActive ? "bg-[#1a1a1a]" : ""
              }`}
            >
              <div
                className={`flex size-6 items-center justify-center rounded-full ${
                  isComplete
                    ? "bg-green-500"
                    : isFailed && isCurrent
                      ? "bg-red-500"
                      : isActive
                        ? "bg-white"
                        : "bg-[#333]"
                }`}
              >
                {isComplete ? (
                  <Check className="size-3.5 text-black" />
                ) : isFailed && isCurrent ? (
                  <X className="size-3.5 text-white" />
                ) : isActive ? (
                  <Loader2 className="size-3.5 animate-spin text-black" />
                ) : (
                  <span className="text-xs text-[#666]">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-sm ${
                  isComplete
                    ? "text-[#7b7b7b]"
                    : isActive
                      ? "font-medium text-white"
                      : "text-[#555]"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {isFailed && error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {jobStatus?.status === "generating_proof" && (
        <p className="text-center text-xs text-[#7b7b7b]">
          Proof generation typically takes 1-2 minutes...
        </p>
      )}

      {isFailed && (
        <motion.button
          onClick={onRetry}
          className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          whileTap={{ scale: 0.98 }}
        >
          Try Again
        </motion.button>
      )}
    </div>
  );
}
