/**
 * Swap Flow Store (Zustand)
 * 
 * Centralized state management for the swap transaction flow.
 * Follows 2026 best practices (matching sendStore.ts):
 * - Export custom hooks only (not the store directly)
 * - Use selectors to prevent unnecessary re-renders
 * - Immutable state updates
 * - Clear separation of concerns
 */

import { create } from "zustand";
import type { Token } from "@/lib/types/swap";

interface SwapState {
  // Token state
  tokenIn: Token | null;
  tokenOut: Token | null;
  
  // Amount state
  amountIn: string;
  amountOut: number;
  
  // Swap configuration
  slippage: number; // Percentage (e.g., 0.5 for 0.5%)
  batchSize: 20 | 50 | 100;
  
  // UI state
  isUsdMode: boolean;
  usedMax: boolean;
  
  // Actions
  setTokenIn: (token: Token | null) => void;
  setTokenOut: (token: Token | null) => void;
  setAmountIn: (amount: string) => void;
  setAmountOut: (amount: number) => void;
  setSlippage: (slippage: number) => void;
  setBatchSize: (size: 20 | 50 | 100) => void;
  setIsUsdMode: (isUsd: boolean) => void;
  setUsedMax: (used: boolean) => void;
  swapTokens: () => void; // Swap tokenIn and tokenOut
  reset: () => void;
}

const initialState = {
  tokenIn: null,
  tokenOut: null,
  amountIn: "",
  amountOut: 0,
  slippage: 0.5,
  batchSize: 20 as const,
  isUsdMode: true,
  usedMax: false,
};

// Store - exported for direct use (Zustand v5 best practice for avoiding hook wrapper issues)
export const useSwapStore = create<SwapState>((set) => ({
  ...initialState,
  
  setTokenIn: (token) => set({ tokenIn: token }),
  setTokenOut: (token) => set({ tokenOut: token }),
  setAmountIn: (amount) => set({ amountIn: amount }),
  setAmountOut: (amount) => set({ amountOut: amount }),
  setSlippage: (slippage) => set({ slippage }),
  setBatchSize: (size) => set({ batchSize: size }),
  setIsUsdMode: (isUsd) => set({ isUsdMode: isUsd }),
  setUsedMax: (used) => set({ usedMax: used }),
  
  // Swap tokenIn and tokenOut (for the swap direction button)
  swapTokens: () => set((state) => ({
    tokenIn: state.tokenOut,
    tokenOut: state.tokenIn,
    // Reset amounts when swapping direction
    amountIn: "",
    amountOut: 0,
    usedMax: false,
  })),
  
  reset: () => set(initialState),
}));

// ==========================================
// Selectors (use directly with useSwapStore)
// ==========================================
// Components should use: const tokenIn = useSwapStore((s) => s.tokenIn)
// This avoids wrapper hooks that can cause re-render issues
