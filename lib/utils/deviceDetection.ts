/**
 * Device Detection Utilities
 * 
 * Multi-layered approach to detect mobile devices:
 * 1. User agent string detection
 * 2. Screen size detection
 * 3. Touch capability detection
 * 
 * This makes it very difficult to bypass on actual mobile devices.
 */

/**
 * Detects if the current device is mobile using multiple signals
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  // 1. User Agent Detection (catches most mobile devices)
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
    "mobile",
    "tablet",
  ];
  const hasUserAgentMatch = mobileKeywords.some((keyword) =>
    userAgent.includes(keyword)
  );

  // 2. Screen Size Detection (mobile-sized screens)
  const hasSmallScreen = window.innerWidth <= 768;

  // 3. Touch Capability Detection
  const hasTouchScreen =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is legacy IE
    navigator.msMaxTouchPoints > 0;

  // Device is considered mobile if:
  // - User agent matches mobile keywords, OR
  // - Screen is small AND device has touch capability
  return hasUserAgentMatch || (hasSmallScreen && hasTouchScreen);
}

/**
 * Hook to detect mobile devices with window resize handling
 */
export function useIsMobile(): boolean {
  if (typeof window === "undefined") return false;

  const [isMobile, setIsMobile] = React.useState(isMobileDevice());

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(isMobileDevice());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

// Need to import React for the hook
import React from "react";
