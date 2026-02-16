"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";

/**
 * Wallet-Scoped Recent Sends
 *
 * Architecture Decision:
 * Recent sends are scoped to the connected wallet address to:
 * - Prevent showing another user's history on shared devices
 * - Clear the UI when wallet is disconnected (privacy)
 * - Maintain separate history per wallet if user switches accounts
 *
 * Storage key format: "era-recent-sends-{walletAddress}"
 *
 * Uses useSyncExternalStore for React Compiler compatibility when
 * syncing with localStorage.
 */

const STORAGE_KEY_PREFIX = "era-recent-sends";
const MAX_RECENT = 5;

export interface RecentSend {
  address: string;
  ensName?: string;
  lastUsed: number;
}

function getStorageKey(walletAddress: string): string {
  return `${STORAGE_KEY_PREFIX}-${walletAddress.toLowerCase()}`;
}

function loadRecentSends(walletAddress: string | undefined): RecentSend[] {
  if (typeof window === "undefined" || !walletAddress) return [];
  try {
    const stored = localStorage.getItem(getStorageKey(walletAddress));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Simple event emitter for storage updates
const listeners = new Set<() => void>();
function emitChange() {
  listeners.forEach((listener) => listener());
}

export function useRecentSends() {
  const { address, isConnected } = useAccount();

  const subscribe = useCallback((callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, []);

  const getSnapshot = useCallback(() => {
    if (!isConnected || !address) return null;
    return localStorage.getItem(getStorageKey(address));
  }, [address, isConnected]);

  const getServerSnapshot = useCallback(() => null, []);

  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const recentSends = useMemo<RecentSend[]>(() => {
    if (!stored || !isConnected) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, [stored, isConnected]);

  // Add a new send to the list
  const addRecentSend = useCallback((toAddress: string, ensName?: string) => {
    if (!address) return;

    const current = loadRecentSends(address);
    
    // Remove existing entry for this address
    const filtered = current.filter(
      (r) => r.address.toLowerCase() !== toAddress.toLowerCase()
    );

    // Add new entry at the start
    const updated: RecentSend[] = [
      { address: toAddress, ensName, lastUsed: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENT);

    // Persist to localStorage (scoped to wallet)
    try {
      localStorage.setItem(getStorageKey(address), JSON.stringify(updated));
      emitChange();
    } catch {
      // Ignore localStorage errors
    }
  }, [address]);

  // Clear all recent sends for current wallet
  const clearRecentSends = useCallback(() => {
    if (!address) return;
    
    try {
      localStorage.removeItem(getStorageKey(address));
      emitChange();
    } catch {
      // Ignore localStorage errors
    }
  }, [address]);

  return { recentSends, addRecentSend, clearRecentSends };
}
