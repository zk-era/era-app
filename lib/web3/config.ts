import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder";

const ALCHEMY_ID = process.env.NEXT_PUBLIC_ALCHEMY_ID || "";

export const config = getDefaultConfig({
  appName: "ERA Protocol",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      ALCHEMY_ID
        ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_ID}`
        : undefined,
    ),
  },
  ssr: true,
});
