import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Image from "next/image";
import Link from "next/link";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${openRunde.variable} antialiased h-full font-open-runde bg-[#131313] text-white`}
      >
        <Link href="/" className="fixed left-6 top-6 z-50 transition-opacity hover:opacity-80">
          <Image
            src="/era-logo.svg"
            alt="ERA Protocol"
            width={24}
            height={24}
            priority
          />
        </Link>
        <div className="flex h-full w-full items-center justify-center">
          {children}
        </div>
      </body>
    </html>
  );
}
