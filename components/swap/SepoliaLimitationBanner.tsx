"use client";

import { useEffect } from "react";
import { sileo } from "sileo";
import { AlertTriangle } from "lucide-react";

/**
 * Sepolia Limitation Banner
 * 
 * Shows warning about Sepolia testnet swap limitations EVERY TIME user visits swap page
 * Stays visible until user clicks "Got it" to dismiss
 * Uses Sileo for consistent notification styling
 */
export function SepoliaLimitationBanner() {
  useEffect(() => {
    // Show banner after a small delay for better UX
    const timer = setTimeout(() => {
      sileo.info({
        title: "Sepolia Testnet Swap Limitations",
        description: "Sepolia has limited Uniswap liquidity, so swap quotes may appear unusual. This is a testnet infrastructure limitation, not an ERA Protocol issue. Swaps still execute successfully with +60% savings!",
        icon: <AlertTriangle className="w-4 h-4 text-amber-500 ml-1" />,
        duration: null, // Keep open until user clicks "Got it"
        button: {
          title: "Got it",
          onClick: () => {
            // Banner will dismiss when clicked, but will show again on next visit
          },
        },
        styles: {
          title: "text-amber-500!",
          description: "text-white/70!",
          button: "bg-amber-500! hover:bg-amber-600! text-black! font-semibold!",
        },
      });
    }, 800); // Show after 800ms

    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs once per page mount

  return null; // This component doesn't render anything, just triggers Sileo
}
