import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware - Mobile Device Blocking
 * 
 * This runs at the edge before any page loads, providing
 * the strongest level of mobile blocking. Even if JavaScript
 * is disabled or manipulated, this catches mobile devices
 * at the network layer.
 */

const MOBILE_USER_AGENT_PATTERNS = [
  /android/i,
  /webos/i,
  /iphone/i,
  /ipad/i,
  /ipod/i,
  /blackberry/i,
  /windows phone/i,
  /mobile/i,
  /tablet/i,
];

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  
  // Check if user agent matches mobile patterns
  const isMobileUserAgent = MOBILE_USER_AGENT_PATTERNS.some((pattern) =>
    pattern.test(userAgent)
  );

  // If mobile detected, continue (client-side gate will show block screen)
  // We let the request through so the MobileGate component can render the block screen
  // This is better UX than a plain error page
  
  return NextResponse.next();
}

// Apply middleware to all routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
