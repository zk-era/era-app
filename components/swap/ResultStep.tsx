/**
 * Swap Result Step
 * Shows successful swap completion with gas savings
 * 
 * Matches send flow architecture:
 * - Same gas savings display
 * - Same batch details
 * - Same animations
 */
"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import type { POCResult } from "@/lib/api/era";
import { useSwapStore } from "@/lib/stores/swapStore";

interface ResultStepProps {
  result: POCResult;
  onDone: () => void;
}

export function ResultStep({ result, onDone }: ResultStepProps) {
  const { gasComparison, timing, batchDetails } = result;
  const tokenIn = useSwapStore((s) => s.tokenIn);
  const tokenOut = useSwapStore((s) => s.tokenOut);
  const amountIn = useSwapStore((s) => s.amountIn);
  const amountOut = useSwapStore((s) => s.amountOut);

  return (
    <div className="flex flex-col gap-6">
      {/* Success Header */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="flex size-16 items-center justify-center rounded-full bg-green-500"
        >
          <CheckCircle2 className="size-8 text-black" aria-hidden="true" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-xl font-bold">Swap Settled!</h1>
          <p className="mt-1 text-sm text-[#7b7b7b]">
            Swapped {amountIn} {tokenIn?.symbol} → {amountOut.toFixed(6)} {tokenOut?.symbol}
          </p>
          <p className="text-xs text-[#555]">
            Batched with {batchDetails.paddingTransactions} other transactions
          </p>
        </motion.div>
      </div>

      {/* Gas Savings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-green-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-green-500">Gas Savings</span>
        </div>

        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-green-400">
              {gasComparison.savingsPercent.toFixed(1)}%
            </p>
            <p className="text-sm text-green-500/70">cheaper than L1</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-white">
              ${gasComparison.savedUsd}
            </p>
            <p className="text-xs text-[#7b7b7b]">saved</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-green-500/20 pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#7b7b7b]">Direct L1 swap cost</span>
            <span className="font-medium line-through opacity-50">
              ${gasComparison.directL1CostUsd}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7b7b7b]">ERA swap cost</span>
            <span className="font-semibold text-green-400">
              ${gasComparison.eraCostUsd}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Transaction Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-sm font-semibold text-[#7b7b7b]">Details</h2>

        <div className="space-y-2 rounded-xl bg-[#1a1a1a] p-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#7b7b7b]">Batch size</span>
            <span className="font-medium">{batchDetails.totalTransactions} txs</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7b7b7b]">Your position</span>
            <span className="font-medium">#{batchDetails.userTransactionIndex + 1}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7b7b7b]">Proof time</span>
            <span className="font-medium">
              {(timing.proofGenerationMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#7b7b7b]">Total time</span>
            <span className="font-medium">
              {(timing.totalMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col gap-3"
      >
        <a
          href={result.etherscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] py-3 text-sm font-semibold transition-colors hover:bg-[#222]"
          aria-label="View transaction on Etherscan"
        >
          View on Etherscan
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>

        <motion.button
          onClick={onDone}
          className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          whileTap={{ scale: 0.98 }}
          aria-label="Return to swap page"
        >
          Done
        </motion.button>
      </motion.div>

      {/* Batch ID */}
      <p className="text-center text-xs text-[#555]">
        Batch: {result.batchId.slice(0, 10)}...{result.batchId.slice(-8)}
      </p>
    </div>
  );
}
