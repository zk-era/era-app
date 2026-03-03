/**
 * Send Flow Store (Zustand)
 * 
 * Centralized state management for the send transaction flow.
 * Follows 2026 best practices:
 * - Export custom hooks only (not the store directly)
 * - Use selectors to prevent unnecessary re-renders
 * - Immutable state updates
 * - Clear separation of concerns
 */

import { create } from "zustand";
import type { Token } from "@/lib/types/swap";

interface SendState {
  // Recipient state
  recipient: string;
  resolvedAddress: string; // Ethereum 0x address for transactions
  
  // Token state
  selectedToken: Token | null;
  
  // Amount state
  amount: string;
  isUsdMode: boolean;
  usedMax: boolean;
  
  // Batch configuration
  batchSize: 20 | 50 | 100;
  
  // Actions
  setRecipient: (recipient: string) => void;
  setResolvedAddress: (address: string) => void;
  setSelectedToken: (token: Token | null) => void;
  setAmount: (amount: string) => void;
  setIsUsdMode: (isUsd: boolean) => void;
  setUsedMax: (used: boolean) => void;
  setBatchSize: (size: 20 | 50 | 100) => void;
  reset: () => void;
}

const initialState = {
  recipient: "",
  resolvedAddress: "",
  selectedToken: null,
  amount: "",
  isUsdMode: true,
  usedMax: false,
  batchSize: 20 as const,
};

// Store - exported for direct use (Zustand v5 best practice for avoiding hook wrapper issues)
export const useSendStore = create<SendState>((set) => ({
  ...initialState,
  
  setRecipient: (recipient) => set({ recipient }),
  setResolvedAddress: (address) => set({ resolvedAddress: address }),
  setSelectedToken: (token) => set({ selectedToken: token }),
  setAmount: (amount) => set({ amount }),
  setIsUsdMode: (isUsd) => set({ isUsdMode: isUsd }),
  setUsedMax: (used) => set({ usedMax: used }),
  setBatchSize: (size) => set({ batchSize: size }),
  reset: () => set(initialState),
}));

// ==========================================
// Selectors (use directly with useSendStore)
// ==========================================
// Components should use: const recipient = useSendStore((s) => s.recipient)
// This avoids wrapper hooks that can cause re-render issues
