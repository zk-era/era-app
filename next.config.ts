import type { NextConfig } from "next";

/**
 * Next.js Configuration
 *
 * Known Build Warnings (safe to ignore):
 * - "@react-native-async-storage/async-storage" not found:
 *   This comes from @metamask/sdk which bundles React Native code for cross-platform
 *   support. The warning appears because we're building for web, not React Native.
 *   It doesn't affect functionality - MetaMask works correctly in the browser.
 *   See: https://github.com/MetaMask/metamask-sdk/issues/296
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/trustwallet/assets/**",
      },
      {
        protocol: "https",
        hostname: "tokens.1inch.io",
      },
    ],
  },
};

export default nextConfig;
