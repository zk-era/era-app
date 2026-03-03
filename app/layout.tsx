import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
import { Toaster } from "sileo";
import { Web3Provider } from "@/components/Web3Provider";
import { WalletButton } from "@/components/WalletButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openRunde = localFont({
  src: [
    {
      path: "../public/fonts/OpenRunde-Regular-BF64ee9c627e5b6.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Medium-BF64ee9c62ad3ad.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Semibold-BF64ee9c629e0a5.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/OpenRunde-Bold-BF64ee9c62a2035.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-open-runde",
});

export const metadata: Metadata = {
  title: "ERA Protocol",
  description: "Ethereum transactions at a fraction of the cost",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

/**
 * Root Layout
 *
 * Centering Strategy:
 * We use `min-h-dvh` (dynamic viewport height) instead of `h-full` for vertical
 * centering. This is more robust because it doesn't rely on height propagating
 * through every parent element. Third-party providers like RainbowKitProvider
 * inject wrapper divs that break the `h-full` chain. Using `min-h-dvh` ensures
 * the container is always at least viewport height regardless of DOM nesting.
 *
 * `dvh` also handles mobile browsers correctly where the viewport height changes
 * as the address bar shows/hides.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${openRunde.variable} antialiased font-open-runde bg-black text-white`}
      >
        <Web3Provider>
          <Toaster 
            position="top-center" 
            options={{
              fill: "#1a1a1a",
              styles: {
                title: "color: #fff",
                description: "color: #7b7b7b",
              },
            }}
          />
          <Link href="/" aria-label="ERA Protocol home" className="fixed left-6 top-6 z-50 transition-opacity hover:opacity-80">
            <Image
              src="/era-logo.svg"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              priority
            />
          </Link>
          <div className="fixed right-6 top-6 z-50">
            <WalletButton />
          </div>
          <div className="flex min-h-dvh w-full flex-col">
            <div className="flex flex-1 items-center justify-center">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
            <Footer />
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
