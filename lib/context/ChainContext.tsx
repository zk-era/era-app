"use client";

/**
 * Chain Context
 * 
 * Captures the connected chain's icon URL from RainbowKit and makes it
 * available app-wide. The icon URL comes from ConnectButton.Custom render
 * props, so we need a context to share it.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ChainContextValue {
  chainIcon: string | undefined;
  chainName: string | undefined;
  setChainInfo: (icon: string | undefined, name: string | undefined) => void;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainIcon, setChainIcon] = useState<string | undefined>();
  const [chainName, setChainName] = useState<string | undefined>();

  const setChainInfo = useCallback((icon: string | undefined, name: string | undefined) => {
    setChainIcon(icon);
    setChainName(name);
  }, []);

  return (
    <ChainContext.Provider value={{ chainIcon, chainName, setChainInfo }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChainInfo() {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error("useChainInfo must be used within a ChainProvider");
  }
  return context;
}
