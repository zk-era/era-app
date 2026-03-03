import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, fallback } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder";

const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_ID || "";

export const config = getDefaultConfig({
  appName: "ERA Protocol",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [sepolia, mainnet], // Sepolia for transactions, mainnet for ENS resolution
  transports: {
    // Best practice: Paid RPC first, public fallback for redundancy
    [sepolia.id]: fallback([
      http(
        ALCHEMY_ID
          ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`
          : `https://rpc.sepolia.org`,
        {
          batch: false, // Disable batching to avoid stale cache issues
          timeout: 10_000, // 10s timeout
        }
      ),
      http(`https://rpc.sepolia.org`, { timeout: 10_000 }), // Public fallback
    ]),
    [mainnet.id]: http(
      ALCHEMY_ID
        ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_ID}`
        : undefined,
    ),
  },
  ssr: true,
});
