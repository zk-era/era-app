/**
 * Swap Confirmation Step
 * MetaMask-style design with overlapping token icons
 * Shows swap details, collapsible "See Details" section
 */
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAccount } from "wagmi";
import makeBlockie from "ethereum-blockies-base64";
import { eraApi, type POCEstimate } from "@/lib/api/era";
import { formatGasUsd } from "@/lib/utils/format";
import type { Token, ERAQuoteComparison } from "@/lib/types/swap";

const BATCH_SIZE_OPTIONS = [20, 50, 100] as const;
const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 2.0] as const; // 0.1%, 0.5%, 1%, 2%

interface SwapConfirmStepProps {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: number;
  amountOut: number;
  comparison: ERAQuoteComparison | null;
  onBack: () => void;
  onConfirm: (batchSize: number, slippage: number) => void;
  isProcessing?: boolean;
}

export function SwapConfirmStep({
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  comparison,
  onBack,
  onConfirm,
  isProcessing = false,
}: SwapConfirmStepProps) {
  const { address: userAddress } = useAccount();
  const [estimate, setEstimate] = useState<POCEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const [slippageDropdownOpen, setSlippageDropdownOpen] = useState(false);
  const [batchSize, setBatchSize] = useState<20 | 50 | 100>(20);
  const [slippage, setSlippage] = useState<0.1 | 0.5 | 1.0 | 2.0>(0.5);

  useEffect(() => {
    let cancelled = false;

    eraApi
      .getEstimate(batchSize)
      .then((data) => {
        if (!cancelled) {
          setEstimate(data);
        }
      })
      .catch(() => {
        // Error is already handled by estimate loading state
        // No need to log here as it would be redundant
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [batchSize]);

  const userAvatar = userAddress ? makeBlockie(userAddress) : null;
  const truncatedAddress = userAddress 
    ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
    : "Connected Wallet";

  // Calculate accurate swap metrics
  const exchangeRate = amountIn > 0 ? amountOut / amountIn : 0;
  
  // Price impact calculation (simplified)
  const priceImpact = comparison 
    ? ((parseFloat(comparison.uniswap.outputAmount) - amountOut) / parseFloat(comparison.uniswap.outputAmount)) * 100
    : 0;
  
  // Use REAL backend estimates for savings (not hardcoded frontend values)
  const savingsPercent = estimate?.savingsPercent ?? 0;
  const directCostUSD = parseFloat(estimate?.directL1CostUsd ?? "0");
  const eraCostUSD = parseFloat(estimate?.eraCostUsd ?? "0");
  const savingsUSD = directCostUSD - eraCostUSD;

  return (
    <div className="flex flex-col gap-6 pt-16">
      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loading && "Loading gas estimate"}
        {estimate && !loading && `Fee estimate: ${formatGasUsd(estimate.eraCostUsd)}`}
      </div>

      <div className="flex flex-col gap-4">
        {/* Overlapping Token Icons - Left Aligned */}
        <div className="flex items-center">
          <div className="relative flex items-center">
            <Image
              src={tokenIn.logoURI || "/default-token.png"}
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              className="rounded-full"
            />
            <Image
              src={tokenOut.logoURI || "/default-token.png"}
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              className="-ml-4 rounded-full"
            />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold leading-tight">
          Confirm swap of {tokenIn.symbol} to {tokenOut.symbol}
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {/* Swap Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">
            Swap {tokenIn.symbol}
          </span>
          <div className="flex items-center gap-2">
            <Image
              src={tokenIn.logoURI || "/default-token.png"}
              alt=""
              aria-hidden="true"
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-base font-semibold">
              {amountIn.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 8,
              })}
            </span>
          </div>
        </div>

        {/* Receive Amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">
            Receive {tokenOut.symbol}
          </span>
          <div className="flex items-center gap-2">
            <Image
              src={tokenOut.logoURI || "/default-token.png"}
              alt=""
              aria-hidden="true"
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-base font-semibold">
              {amountOut.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 8,
              })}
            </span>
          </div>
        </div>

        {/* Swap Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-sm text-[var(--color-era-secondary)]">Rate</span>
            <button
              type="button"
              className="text-[var(--color-era-secondary)] hover:text-white/70"
              title="Exchange rate for this swap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-medium text-white/70">
            1 {tokenIn.symbol} = {exchangeRate.toFixed(6)} {tokenOut.symbol}
          </span>
        </div>

        {/* Wallet */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">Wallet</span>
          <div className="flex items-center gap-2">
            {userAvatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt=""
                aria-hidden="true"
                width={20}
                height={20}
                className="rounded-full"
              />
            )}
            <span className="text-base font-semibold">{truncatedAddress}</span>
          </div>
        </div>

        {/* Collapsible Details - Appears above dotted line */}
        {detailsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3"
            style={{ overflow: "visible" }}
          >
            {/* Price Impact */}
            {priceImpact !== 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-[var(--color-era-secondary)]">Price Impact</span>
                  <button
                    type="button"
                    className="text-[var(--color-era-secondary)] hover:text-white/70"
                    title="The difference between market price and estimated execution price"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <span className={`text-sm font-medium ${Math.abs(priceImpact) > 1 ? "text-orange-500" : "text-green-500"}`}>
                  {priceImpact > 0 ? "+" : ""}{priceImpact.toFixed(2)}%
                </span>
              </div>
            )}

            {/* Slippage Tolerance - Configurable */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-era-secondary)]">Slippage Tolerance</span>
              <div className="relative">
                <button
                  onClick={() => setSlippageDropdownOpen(!slippageDropdownOpen)}
                  aria-label={`Select slippage tolerance, currently ${slippage}%`}
                  aria-expanded={slippageDropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-background-secondary] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-background-tertiary)]"
                >
                  <ChevronDown className={`size-3.5 text-[var(--color-era-secondary)] transition-transform ${slippageDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  <span className="font-medium text-white/70" aria-hidden="true">{slippage}%</span>
                </button>
                {slippageDropdownOpen && (
                  <div 
                    role="menu"
                    aria-label="Slippage tolerance options"
                    className="absolute right-0 top-full z-10 mt-1 min-w-[80px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background-secondary)]"
                  >
                    {SLIPPAGE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        role="menuitem"
                        onClick={() => {
                          setSlippage(option);
                          setSlippageDropdownOpen(false);
                        }}
                        aria-label={`Set slippage tolerance to ${option}%`}
                        aria-current={option === slippage ? "true" : undefined}
                        className={`flex w-full items-center justify-center px-4 py-2 text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
                          option === slippage ? "bg-[var(--color-background-tertiary)] text-white font-medium" : "text-white/70"
                        }`}
                      >
                        {option}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-era-secondary)]">Route</span>
              <span className="text-sm font-medium text-white/70">
                Uniswap V2
              </span>
            </div>

            {/* ERA Savings - Using REAL backend estimates */}
            {savingsPercent > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-era-secondary)]">ERA Savings</span>
                <span className="text-sm font-medium text-green-500">
                  {savingsPercent}% cheaper (${savingsUSD.toFixed(2)} saved)
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* See Details Dropdown with Dotted Lines */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 border-t border-dashed border-[var(--color-border)]" />
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="flex items-center gap-2 text-sm text-[var(--color-era-secondary)] transition-colors hover:text-white"
          >
            See Details
            <ChevronDown 
              className={`size-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} 
              aria-hidden="true" 
            />
          </button>
          <div className="flex-1 border-t border-dashed border-[var(--color-border)]" />
        </div>

        {/* Batch Size Selector - Below See Details */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">Batch Size</span>
          <div className="relative">
            <button
              onClick={() => setBatchDropdownOpen(!batchDropdownOpen)}
              aria-label={`Select batch size, currently ${batchSize}`}
              aria-expanded={batchDropdownOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 rounded-lg bg-[var(--color-background-secondary] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-background-tertiary)]"
            >
              <ChevronDown className={`size-3.5 text-[var(--color-era-secondary)] transition-transform ${batchDropdownOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              <span className="font-medium text-white/70" aria-hidden="true">{batchSize}</span>
            </button>
            {batchDropdownOpen && (
              <div 
                role="menu"
                aria-label="Batch size options"
                className="absolute right-0 top-full z-10 mt-1 min-w-[80px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background-secondary)]"
              >
                {BATCH_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    role="menuitem"
                    onClick={() => {
                      setBatchSize(size);
                      setBatchDropdownOpen(false);
                    }}
                    aria-label={`Set batch size to ${size}`}
                    aria-current={size === batchSize ? "true" : undefined}
                    className={`flex w-full items-center justify-center px-4 py-2 text-sm transition-colors hover:bg-[var(--color-background-tertiary)] ${
                      size === batchSize ? "bg-[var(--color-background-tertiary)] text-white font-medium" : "text-white/70"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fee Estimate - Stays Visible */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-era-secondary)]">Fee estimate</span>
          {loading ? (
            <Loader2 className="size-4 animate-spin text-white/50" aria-hidden="true" />
          ) : estimate ? (
            <span className="text-sm font-medium text-white/70">
              {formatGasUsd(estimate.eraCostUsd)}
            </span>
          ) : (
            <span className="text-sm text-white/50">—</span>
          )}
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-[var(--color-era-tertiary)]">
        Review the above before confirming.
        <br />
        Once made, your transaction is irreversible.
      </p>

      <div className="flex gap-3">
        <motion.button
          onClick={onBack}
          disabled={isProcessing}
          aria-label="Go back to edit amount"
          className="flex-1 rounded-[20px] bg-[var(--color-background-secondary)] py-3 text-sm font-semibold transition-colors hover:bg-[var(--color-background-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
          whileTap={isProcessing ? {} : { scale: 0.98 }}
        >
          Edit Amount
        </motion.button>
        <motion.button
          onClick={() => onConfirm(batchSize, slippage)}
          disabled={isProcessing || loading}
          aria-label={isProcessing ? "Transaction processing, please wait" : `Confirm swapping ${amountIn.toFixed(6)} ${tokenIn.symbol} for ${amountOut.toFixed(6)} ${tokenOut.symbol}`}
          aria-busy={isProcessing}
          className="flex flex-1 items-center justify-center gap-2 rounded-[20px] bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          whileTap={isProcessing ? {} : { scale: 0.98 }}
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Processing
            </>
          ) : (
            "Confirm"
          )}
        </motion.button>
      </div>
    </div>
  );
}
