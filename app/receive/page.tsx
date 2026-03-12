"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReceivePage() {
  return (
    <div className="flex w-full max-w-[400px] flex-col self-start gap-6 px-4 pt-20">
      {/* Header */}
      <div className="flex w-full items-center">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#7b7b7b] transition-colors hover:bg-[#1a1a1a] hover:text-white"
          aria-label="Back to home"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Link>
      </div>

      {/* Coming Soon Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 rounded-2xl border border-[#303030]/50 bg-[#121212] p-6 text-center"
      >
        <h1 className="text-xl font-bold">Receive</h1>
        <p className="text-sm text-[#7b7b7b]">
          Coming soon
        </p>
      </motion.div>
    </div>
  );
}
