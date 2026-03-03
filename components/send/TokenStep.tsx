/**
 * Phase 2: Token Selection
 * User selects which token to send
 * 
 * Phase 2 Updates:
 * - Uses Zustand store for recipient and token state
 * - Simplified props (recipient comes from store)
 */
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SendHeader } from "@/components/shared/SendHeader";
import { RecipientChip } from "@/components/shared/RecipientChip";
import { Container } from "@/components/ui/container";
import { useSendStore } from "@/lib/stores/sendStore";
import type { Token } from "@/lib/types/swap";

interface TokenStepProps {
  tokens: Token[];
  isLoading: boolean;
  isConnected: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export function TokenStep({
  tokens,
  isLoading,
  isConnected,
  onContinue,
  onBack,
}: TokenStepProps) {
  // Zustand store - direct selectors (v5 best practice)
  const recipient = useSendStore((s) => s.recipient);
  const resolvedAddress = useSendStore((s) => s.resolvedAddress);
  const setSelectedToken = useSendStore((s) => s.setSelectedToken);
  
  // Use resolved address for blockie, fallback to recipient
  const displayAddress = resolvedAddress || recipient;
  
  // Display logic: show .eth for ENS names, truncate 0x addresses
  const truncatedRecipient = recipient.startsWith("0x")
    ? recipient.length > 10
      ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}`
      : recipient
    : recipient.endsWith(".eth")
      ? recipient
      : `${recipient}.eth`;
  
  const handleSelectToken = (token: Token) => {
    setSelectedToken(token);
    onContinue();
  };

  return (
    <div className="flex flex-col gap-6">
      <SendHeader onBack={onBack} />

      <Container className="gap-2 rounded-[20px]">
        <span className="text-xs font-medium text-[var(--color-era-secondary)]">To</span>
        <RecipientChip 
          address={displayAddress}
          displayName={truncatedRecipient}
          size="sm"
        />
      </Container>

      <p className="text-sm text-[var(--color-era-secondary)]">
        Which token do you want to send?
      </p>

      <div className="flex flex-col gap-3">
        {!isConnected ? (
          <Container rounded="lg" padding="lg" className="justify-center">
            <p className="text-sm text-[var(--color-era-secondary)]">Connect your wallet to see tokens</p>
          </Container>
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl px-4 py-3">
                <div className="size-10 rounded-full bg-[#222]" />
                <div className="flex-1">
                  <div className="mb-1 h-4 w-16 rounded bg-[#222]" />
                  <div className="h-3 w-12 rounded bg-[#222]" />
                </div>
                <div className="h-4 w-12 rounded bg-[#222]" />
              </div>
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <Container rounded="lg" padding="lg" className="flex-col justify-center">
            <p className="text-sm text-[var(--color-era-secondary)]">No tokens with balance found</p>
            <p className="mt-1 text-xs text-[var(--color-era-tertiary)]">Get testnet USDC from faucet.circle.com</p>
          </Container>
        ) : (
          tokens.map((token) => (
            <motion.button
              key={token.symbol}
              onClick={() => handleSelectToken(token)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-[var(--color-background-secondary)]"
            >
              {token.logoURI ? (
                <Image
                  src={token.logoURI}
                  alt={token.symbol}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-background-secondary] text-sm font-semibold)]">
                  {token.symbol[0]}
                </div>
              )}
              <div className="flex-1 text-left">
                <h2 className="text-sm font-semibold">{token.name || token.symbol}</h2>
                <p className="text-xs text-[var(--color-era-secondary)]">
                  {token.balance?.toLocaleString("en-US", { maximumFractionDigits: 6 }) ?? 0} {token.symbol}
                </p>
              </div>
              <span className="text-sm font-semibold">
                ${((token.balance ?? 0) * (token.price ?? 1)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
