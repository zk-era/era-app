"use client";

/**
 * Send Flow Error Boundary
 * 
 * Catches rendering errors specific to the send flow and provides
 * contextual recovery options for users.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export default function SendError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("[Send Flow Error]", error);
    }
  }, [error]);

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-6 px-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background-secondary)] p-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-3">
            <AlertCircle className="size-8 text-red-500" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Send Transaction Failed</h1>
          <p className="text-sm text-[var(--color-era-secondary)]">
            We encountered an error while processing your send transaction.
          </p>
        </div>

        {error.message && (
          <div className="rounded-lg bg-[var(--color-background)] p-3 text-left">
            <p className="text-xs font-mono text-white/70 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 text-xs text-[var(--color-era-tertiary)]">
          <p>Common solutions:</p>
          <ul className="list-inside list-disc space-y-1 text-left">
            <li>Disconnect and reconnect your wallet</li>
            <li>Check your wallet has sufficient balance</li>
            <li>Verify you&apos;re on the correct network</li>
            <li>Try refreshing the page</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={() => window.location.href = "/"}
            className="flex-1 rounded-[20px] bg-[var(--color-background)] py-3 text-sm font-semibold transition-colors hover:bg-[var(--color-background-tertiary)]"
            whileTap={{ scale: 0.98 }}
          >
            Go Home
          </motion.button>
          <motion.button
            onClick={reset}
            className="flex-1 rounded-[20px] bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            whileTap={{ scale: 0.98 }}
          >
            Try Again
          </motion.button>
        </div>
      </div>
    </div>
  );
}
