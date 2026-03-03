"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "wagmi/chains";
import { config } from "@/lib/web3/config";
import { ChainProvider } from "@/lib/context/ChainContext";
import CustomAvatar from "@/components/CustomAvatar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute default
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
      retry: 1, // Only retry once for faster failures
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          avatar={CustomAvatar}
          initialChain={sepolia}
          theme={darkTheme({
            accentColor: "#fff",
            accentColorForeground: "#000",
            borderRadius: "large",
            overlayBlur: "small",
          })}
        >
          <ChainProvider>{children}</ChainProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
