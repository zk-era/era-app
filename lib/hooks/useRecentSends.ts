"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "era-recent-sends";
const MAX_RECENT = 5;

export interface RecentSend {
  address: string;
  ensName?: string;
  lastUsed: number;
}

export function useRecentSends() {
  const [recentSends, setRecentSends] = useState<RecentSend[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentSends(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Add a new send to the list
  const addRecentSend = useCallback((address: string, ensName?: string) => {
    setRecentSends((prev) => {
      // Remove existing entry for this address
      const filtered = prev.filter(
        (r) => r.address.toLowerCase() !== address.toLowerCase()
      );

      // Add new entry at the start
      const updated: RecentSend[] = [
        { address, ensName, lastUsed: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  // Clear all recent sends
  const clearRecentSends = useCallback(() => {
    setRecentSends([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return { recentSends, addRecentSend, clearRecentSends };
}
