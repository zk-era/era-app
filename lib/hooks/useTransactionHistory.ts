"use client";

/**
 * Transaction History Storage
 *
 * Stores completed transaction results in localStorage, scoped per wallet.
 * Allows users to view detailed transaction info after completion.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";
import type { POCResult } from "@/lib/api/era";

const STORAGE_KEY_PREFIX = "era-tx-history";
const MAX_TRANSACTIONS = 50;

export interface StoredTransaction {
  jobId: string;
  timestamp: number;
  tokenSymbol: string;
  tokenLogo?: string;
  amount: string;
  usdValue: string;
  recipient: string;
  sender: string;
  chainName: string;
  chainIcon?: string;
  result: POCResult;
}

function getStorageKey(walletAddress: string): string {
  return `${STORAGE_KEY_PREFIX}-${walletAddress.toLowerCase()}`;
}

function loadTransactions(walletAddress: string | undefined): StoredTransaction[] {
  if (typeof window === "undefined" || !walletAddress) return [];
  try {
    const stored = localStorage.getItem(getStorageKey(walletAddress));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTransactions(walletAddress: string, transactions: StoredTransaction[]) {
  try {
    localStorage.setItem(getStorageKey(walletAddress), JSON.stringify(transactions));
  } catch {
    // Ignore localStorage errors
  }
}

// Event emitter for storage updates
const listeners = new Set<() => void>();
function emitChange() {
  listeners.forEach((listener) => listener());
}

export function useTransactionHistory() {
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

  const transactions = useMemo<StoredTransaction[]>(() => {
    if (!stored || !isConnected) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, [stored, isConnected]);

  const addTransaction = useCallback(
    (transaction: Omit<StoredTransaction, "timestamp">) => {
      if (!address) return;

      const current = loadTransactions(address);
      const newTransaction: StoredTransaction = {
        ...transaction,
        timestamp: Date.now(),
      };

      // Add to front, remove duplicates, limit size
      const filtered = current.filter((t) => t.jobId !== transaction.jobId);
      const updated = [newTransaction, ...filtered].slice(0, MAX_TRANSACTIONS);

      saveTransactions(address, updated);
      emitChange();
    },
    [address]
  );

  const getTransaction = useCallback(
    (jobId: string): StoredTransaction | undefined => {
      return transactions.find((t) => t.jobId === jobId);
    },
    [transactions]
  );

  const clearHistory = useCallback(() => {
    if (!address) return;
    try {
      localStorage.removeItem(getStorageKey(address));
      emitChange();
    } catch {
      // Ignore
    }
  }, [address]);

  return {
    transactions,
    addTransaction,
    getTransaction,
    clearHistory,
  };
}
