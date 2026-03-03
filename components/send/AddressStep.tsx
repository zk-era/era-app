/**
 * Phase 1: Address Input
 * User enters recipient address or ENS name
 * 
 * Phase 2 Updates:
 * - Uses Zustand store for state management
 * - Uses useRecipientValidation hook for ENS resolution
 * - Uses InlineLoader for consistent loading UX
 */
"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import makeBlockie from "ethereum-blockies-base64";
import { SendHeader } from "@/components/shared/SendHeader";
import { AddressListItem } from "@/components/shared/AddressListItem";
import { Container } from "@/components/ui/container";
import { InlineLoader } from "@/components/LoadingState";
import { useSendStore } from "@/lib/stores/sendStore";
import { useRecipientValidation } from "@/lib/hooks/useRecipientValidation";
import type { RecentSend } from "@/lib/hooks/useRecentSends";

interface AddressStepProps {
  onContinue: () => void;
  recentSends: RecentSend[];
}

export function AddressStep({
  onContinue,
  recentSends,
}: AddressStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Zustand store - direct selectors (v5 best practice)
  const recipient = useSendStore((s) => s.recipient);
  const setRecipient = useSendStore((s) => s.setRecipient);
  const setResolvedAddress = useSendStore((s) => s.setResolvedAddress);
  
  // Validation and ENS resolution
  const { isValid, resolvedAddress, isResolving, error: ensError, normalizedName } = useRecipientValidation(recipient);

  const handlePaste = () => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    navigator.clipboard.readText().then((text) => {
      if (text) setRecipient(text.trim());
    });
  };
  
  const handleContinue = () => {
    // Save resolved address to store
    if (resolvedAddress) {
      setResolvedAddress(resolvedAddress);
    }
    onContinue();
  };

  return (
    <div className="flex flex-col gap-6">
      <SendHeader />
      
      {/* Screen reader announcements for loading states */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isResolving && "Resolving ENS name, please wait"}
        {resolvedAddress && recipient && !recipient.startsWith("0x") && "ENS name resolved successfully"}
        {ensError && normalizedName && "ENS name could not be resolved"}
      </div>

      <Container className="gap-2 rounded-[20px]">
        <span className="text-xs font-medium text-[var(--color-era-secondary)]">To</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="0x... or vitalik.eth"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData("text").trim();
            setRecipient(text);
          }}
          aria-label="Recipient address or ENS name"
          aria-describedby={recipient && !isValid ? "address-error" : undefined}
          aria-invalid={recipient && !isValid ? true : undefined}
          className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:font-medium placeholder:text-[var(--color-era-tertiary)] text-ellipsis overflow-hidden"
          autoFocus
        />
        
        {/* Dynamic button: Paste (empty) → X (typing) → Spinner (resolving) */}
        {!recipient ? (
          // Empty state: Show Paste button (same height as X button)
          <button
            onClick={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePaste();
              }
            }}
            aria-label="Paste address from clipboard"
            className="shrink-0 rounded-lg bg-[var(--color-background-tertiary)] px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--color-background-elevated)]"
          >
            Paste
          </button>
        ) : isResolving ? (
          // Resolving ENS: Show spinner (same size as X button)
          <div aria-label="Resolving ENS name" role="status">
            <InlineLoader size="sm" />
          </div>
        ) : (
          // Has input: Show X to clear
          <button
            onClick={() => setRecipient("")}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setRecipient("");
              }
            }}
            aria-label="Clear recipient address"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-background-tertiary)] transition-colors hover:bg-[var(--color-background-elevated)]"
          >
            <X className="size-3.5 text-white" />
          </button>
        )}
      </Container>

      {/* Search Results - Shows when valid address is entered */}
      {recipient && isValid && (
        <div className="flex flex-col gap-3 pb-4">
          <span className="text-xs font-medium text-[var(--color-era-secondary)]">Search Results</span>
          <AddressListItem
            address={resolvedAddress || recipient}
            displayName={
              recipient.startsWith("0x")
                ? `${recipient.slice(0, 6)}...${recipient.slice(-4)}`
                : recipient.endsWith(".eth")
                  ? recipient
                  : `${recipient}.eth`
            }
            secondaryLabel={
              recipient.startsWith("0x")
                ? "Ethereum Address"
                : resolvedAddress
                  ? `${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}`
                  : normalizedName && ensError
                    ? <span className="text-red-400">{ensError ? "Resolution error" : "No address set"}</span>
                    : "Ethereum Address"
            }
            isLoading={isResolving}
            onClick={handleContinue}
          />
        </div>
      )}

      {/* Error message - Shows when address is invalid */}
      {recipient && !isValid && (
        <Container rounded="lg" padding="lg" className="justify-center" role="alert">
          <p id="address-error" className="text-sm text-[var(--color-era-secondary)]">
            Invalid Ethereum address or ENS name
          </p>
        </Container>
      )}

      {/* Recent Sends - Only show when input is empty */}
      {recentSends.length > 0 && !recipient && (
        <div className="flex flex-col gap-3 pb-4">
          <span className="text-xs font-medium text-[var(--color-era-secondary)]">Recent</span>
          <div className="flex flex-col">
            {recentSends.map((recent) => (
              <AddressListItem
                key={recent.address}
                address={recent.address}
                displayName={
                  recent.ensName 
                    ? recent.ensName 
                    : `${recent.address.slice(0, 6)}...${recent.address.slice(-4)}`
                }
                secondaryLabel={
                  recent.ensName
                    ? `${recent.address.slice(0, 6)}...${recent.address.slice(-4)}`
                    : "Ethereum Address"
                }
                onClick={() => {
                  // Recent sends are already validated - go straight through
                  setRecipient(recent.ensName || recent.address);
                  setResolvedAddress(recent.address);
                  onContinue();
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
