"use client";

/**
 * Transaction Result Detail Page
 *
 * Shows comprehensive details about a completed transaction including:
 * - General info (Value, Network Fee, Gas Price, Nonce, Contract)
 * - Token Transfers (To, From, Amount)
 * - Links to Etherscan
 */

import { useParams, useRouter } from "next/navigation";
import { useTransactionHistory } from "@/lib/hooks/useTransactionHistory";
import { Send, Check, ExternalLink, Copy, Info, Fuel, Sparkles, FileText, Link2, Navigation, Wallet } from "lucide-react";

import { useCallback } from "react";
import { sileo } from "sileo";
import { formatGasUsd } from "@/lib/utils/format";

export default function TransactionResultPage() {
  const params = useParams();
  const router = useRouter();
  const { getTransaction } = useTransactionHistory();

  const jobId = params.jobId as string;
  const transaction = getTransaction(jobId);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    sileo.success({ title: `${label} copied` });
  }, []);

  if (!transaction) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-[400px] flex-col items-center gap-4 px-4 text-center">
          <Info className="size-12 text-[#7b7b7b]" />
          <h1 className="text-xl font-semibold text-white">Transaction Not Found</h1>
          <p className="text-sm text-[#7b7b7b]">
            This transaction may have been cleared from history or the link is invalid.
          </p>
          <button
            onClick={() => router.push("/send")}
            className="mt-4 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90"
          >
            Back to Send
          </button>
        </div>
      </main>
    );
  }

  const { tokenSymbol, tokenLogo, amount, usdValue, recipient, sender, chainName, chainIcon, result, timestamp } = transaction;

  const truncatedRecipient = recipient.endsWith(".eth")
    ? recipient
    : `${recipient.slice(0, 6)}····${recipient.slice(-4)}`;

  const truncatedSender = `${sender.slice(0, 6)}····${sender.slice(-4)}`;

  const formattedDate = new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const networkFeeUsd = result.gasComparison.eraCostUsd;
  const gasSavedUsd = result.gasComparison.savedUsd;
  const savingsPercent = result.gasComparison.savingsPercent;

  return (
    <main className="flex min-h-dvh w-full flex-col items-center justify-center">
      <div className="flex w-full max-w-[400px] flex-col gap-5 px-4">
        {/* Transaction Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {tokenLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokenLogo}
                alt={tokenSymbol}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-[#333] text-base font-bold">
                {tokenSymbol.slice(0, 2)}
              </div>
            )}
            <div className="absolute -left-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#3b82f6] ring-2 ring-[#1a1a1a]">
              <Send className="size-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-white">Sent to {truncatedRecipient}</p>
            <p className="text-sm text-[#7b7b7b]">{formattedDate} · {formattedTime}</p>
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-[#303030] px-4 py-4">
          <p className="text-4xl font-bold text-white">${usdValue}</p>
          <div className="flex items-center gap-1.5">
            {tokenLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokenLogo}
                alt={tokenSymbol}
                width={18}
                height={18}
                className="rounded-full"
              />
            ) : (
              <div className="flex size-[18px] items-center justify-center rounded-full bg-[#333] text-[9px] font-bold">
                {tokenSymbol.slice(0, 2)}
              </div>
            )}
            <p className="text-base font-medium text-[#3b82f6]">{amount} {tokenSymbol}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between rounded-2xl bg-[#1a1a1a] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-5 items-center justify-center rounded-full bg-[#3b82f6]">
              <Check className="size-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-medium text-[#3b82f6]">Completed</span>
          </div>
          <span className="text-sm text-[#7b7b7b]">
            {formattedDate} · <span className="font-semibold text-white">{formattedTime}</span>
          </span>
        </div>

        {/* GENERAL Section */}
        <div className="flex flex-col divide-y divide-[#2a2a2a] rounded-2xl bg-[#1a1a1a] p-4">
          <h2 className="pb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7b7b]">General</h2>
          <div className="flex flex-col divide-y divide-[#2a2a2a]">
            <div className="py-3">
              <DetailRow icon={Fuel} label="Network Fee" value={formatGasUsd(networkFeeUsd)} />
            </div>
            <div className="py-3">
              <DetailRow icon={Sparkles} label="Gas Saved">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                    {savingsPercent.toFixed(0)}% less
                  </span>
                  <span className="text-sm font-medium text-white">{formatGasUsd(gasSavedUsd)}</span>
                </div>
              </DetailRow>
            </div>
            <div className="py-3">
              <DetailRow icon={FileText} label="Settlement TX">
                <button
                  onClick={() => window.open(result.etherscanUrl, "_blank")}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#3b82f6] transition-opacity hover:opacity-70"
                >
                  View on Etherscan
                  <ExternalLink className="size-3" />
                </button>
              </DetailRow>
            </div>
            <div className="py-3 last:pb-0">
              <DetailRow icon={Link2} label="Chain">
                <div className="flex items-center gap-1.5">
                  {chainIcon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={chainIcon}
                      alt={chainName}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="size-4 rounded-full bg-[#627eea]" />
                  )}
                  <span className="text-sm font-medium text-white">{chainName}</span>
                </div>
              </DetailRow>
            </div>
          </div>
        </div>

        {/* TOKEN TRANSFERS Section */}
        <div className="flex flex-col divide-y divide-[#2a2a2a] rounded-2xl bg-[#1a1a1a] p-4">
          <h2 className="pb-3 text-xs font-semibold uppercase tracking-wider text-[#7b7b7b]">Token Transfers</h2>
          <div className="flex flex-col divide-y divide-[#2a2a2a]">
            <div className="py-3">
              <DetailRow icon={Navigation} label="To">
                <button
                  onClick={() => copyToClipboard(recipient, "Recipient")}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#3b82f6] transition-opacity hover:opacity-70"
                >
                  {truncatedRecipient}
                  <Copy className="size-3" />
                </button>
              </DetailRow>
            </div>
            <div className="py-3 last:pb-0">
              <DetailRow icon={Wallet} label="From">
                <button
                  onClick={() => copyToClipboard(sender, "Sender")}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#3b82f6] transition-opacity hover:opacity-70"
                >
                  {truncatedSender}
                  <Copy className="size-3" />
                </button>
              </DetailRow>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pb-4">
          <button
            onClick={() => router.push("/send")}
            className="w-full rounded-xl bg-white py-3.5 font-semibold text-black transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </main>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  badge,
  badgeColor,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string;
  badge?: string;
  badgeColor?: "green" | "blue";
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[#7b7b7b]">
        <Icon className="size-4" />
        <span className="text-sm">{label}</span>
      </div>
      {children ? (
        children
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{value}</span>
          {badge && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                badgeColor === "green"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
