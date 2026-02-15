"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const actions = [
  {
    label: "Send",
    description: "Send tokens to any address or ENS username.",
    href: "/send",
    icon: "/send.svg",
    gradient: "from-blue-500/20 to-blue-600/5",
    borderHover: "hover:border-blue-500/30",
  },
  {
    label: "Swap",
    description: "Swap your ERC20 tokens at a fraction of the cost.",
    href: "/swap",
    icon: "/swap.svg",
    gradient: "from-purple-500/20 to-purple-600/5",
    borderHover: "hover:border-purple-500/30",
  },
  {
    label: "Receive",
    description: "Receive Ethereum based tokens through your unique address.",
    href: "/receive",
    icon: "/receive.svg",
    gradient: "from-green-500/20 to-green-600/5",
    borderHover: "hover:border-green-500/30",
  },
];

export default function Home() {
  return (
    <div className="flex w-full max-w-[400px] flex-col items-center gap-8 px-4">
      <div className="flex w-full flex-col gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
          >
            <Link href={action.href}>
              <div
                className={`group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-[#303030]/50 px-5 py-5 transition-all duration-300 ${action.borderHover}`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                />
                <div className="relative mt-1 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={action.icon}
                    alt={action.label}
                    width={20}
                    height={20}
                  />
                </div>
                <div className="relative flex-1">
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
  );
}
