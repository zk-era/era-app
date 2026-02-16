"use client";

/**
 * Custom Avatar Component for RainbowKit
 *
 * Priority order:
 * 1. ENS avatar (if user has one set)
 * 2. Ethereum Blockies fallback (classic web3 identity)
 *
 * Blockies are deterministic - same address always generates the same
 * pixelated pattern. This is the classic Ethereum identity style used
 * in MetaMask and other wallets.
 *
 * Note: Using native <img> because both ENS avatars and blockies
 * are base64/external URLs that can't use Next.js Image optimization.
 */

import type { AvatarComponent } from "@rainbow-me/rainbowkit";
import makeBlockie from "ethereum-blockies-base64";

const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  const imageUrl = ensImage || makeBlockie(address);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={ensImage ? "ENS Avatar" : "Wallet Avatar"}
      width={size}
      height={size}
      style={{ borderRadius: "50%" }}
    />
  );
};

export default CustomAvatar;
