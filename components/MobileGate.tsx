"use client";

import { useEffect, useState } from "react";
import { isMobileDevice } from "@/lib/utils/deviceDetection";
import { MobileBlockScreen } from "./MobileBlockScreen";

/**
 * Mobile Gate Component
 * 
 * Wraps the app and blocks mobile access.
 * Uses client-side detection to prevent hydration mismatches.
 */
export function MobileGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect on mount and on resize
    const checkMobile = () => setIsMobile(isMobileDevice());
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show nothing during SSR to prevent hydration mismatch
  if (isMobile === null) {
    return null;
  }

  // Block mobile devices
  if (isMobile) {
    return <MobileBlockScreen />;
  }

  // Allow desktop
  return <>{children}</>;
}
