"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";

/**
 * Brand Colors (oklch)
 * - Send:    oklch(0.789 0.154 211.53) - cyan/teal
 * - Swap:    oklch(0.714 0.203 305.504) - purple/violet
 * - Receive: oklch(0.792 0.209 151.711) - green
 */
const actions = [
  {
    label: "Send",
    description: "Send tokens to any address or ENS username.",
    href: "/send",
    icon: "/send.svg",
    color: "oklch(0.789 0.154 211.53)",
  },
  {
    label: "Swap",
    description: "Swap your ERC20 tokens at a fraction of the cost.",
    href: "/swap",
    icon: "/swap.svg",
    color: "oklch(0.714 0.203 305.504)",
  },
  {
    label: "Receive",
    description: "Receive Ethereum based tokens through your unique address.",
    href: "/receive",
    icon: "/receive.svg",
    color: "oklch(0.792 0.209 151.711)",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-[400px] flex-col items-center gap-8 px-4">
          <div className="flex w-full flex-col gap-3">
            {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
          >
            <Link href={action.href} aria-label={`${action.label}: ${action.description}`}>
              <div
                className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-[#303030]/50 px-5 py-5 transition-all duration-300"
                style={{
                  // @ts-expect-error CSS custom property for hover border color
                  "--action-color": action.color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `color-mix(in oklch, ${action.color} 30%, transparent)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(to right, color-mix(in oklch, ${action.color} 20%, transparent), color-mix(in oklch, ${action.color} 5%, transparent))`,
                  }}
                />
                <div className="relative mt-1 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={action.icon}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                  />
                </div>
                <div className="relative flex-1" aria-hidden="true">
                  <h2 className="text-lg font-semibold">{action.label}</h2>
                  <p className="text-sm text-[#7b7b7b]">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
