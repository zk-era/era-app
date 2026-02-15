"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReceivePage() {
  return (
    <div className="flex w-full max-w-[400px] flex-col items-center gap-6 px-4">
      <div className="flex w-full items-center">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#7b7b7b] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-2xl border border-[#303030]/50 bg-[#121212] p-6 text-center"
      >
        <h1 className="text-2xl font-bold">Receive</h1>
        <p className="mt-2 text-sm text-[#7b7b7b]">
          Wallet address display coming soon
        </p>
      </motion.div>
    </div>
  );
}
