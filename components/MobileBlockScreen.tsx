"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ScrambleText from "./ScrambleText";

/**
 * Mobile Block Screen
 * 
 * Prevents mobile access during testnet phase.
 * Displays a clear message directing users to desktop.
 * 
 * Mobile-optimized with proper viewport handling and spacing.
 * Features Matrix-style scramble text animation on load.
 */
export function MobileBlockScreen() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile for animation speed adjustment
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Moderate scramble animation speed (2x faster than original)
  const speed = isMobile ? 12 : 7;

  return (
    <div 
      data-mobile-block-screen
      className="fixed inset-0 flex h-dvh w-full flex-col overflow-hidden bg-black text-white"
      style={{
        // Ensure proper viewport handling on iOS
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* ERA Logo - Fixed top left like main app */}
      <div className="fixed left-6 top-6 z-50">
        <Image
          src="/era-logo.svg"
          alt="ERA Protocol"
          width={24}
          height={24}
          priority
        />
      </div>

      {/* Center content */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="flex max-w-sm flex-col items-center">
          {/* Heading */}
          <h1 className="mb-4 text-center text-xl font-bold">
            Desktop Only
          </h1>

          {/* Message - Scramble text animation */}
          <ScrambleText
            text="ERA Protocol is currently optimized for desktop browsers during testnet. For the best experience and security when testing with burner wallets, please access this app from a desktop or laptop computer."
            delay={300}
            scrambleSpeed={speed}
            className="mb-6 text-center text-sm leading-relaxed text-[#7b7b7b]"
            as="p"
          />

          {/* URL Display */}
          <div className="rounded-xl bg-[#1a1a1a] px-4 py-3">
            <p className="text-sm font-mono text-[#7b7b7b]">
              demo.zkera.xyz
            </p>
          </div>
        </div>
      </div>

      {/* Footer Note - Bottom of screen */}
      <div className="pb-8 text-center">
        <p className="text-xs text-[#555]">
          Mobile support coming soon
        </p>
      </div>
    </div>
  );
}
