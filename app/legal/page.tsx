"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function LegalPage() {
  const lastUpdated = "February 26, 2026";

  return (
    <main className="flex w-full items-center justify-center">
      <motion.div 
        className="w-full max-w-3xl px-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className="mb-12" variants={itemVariants}>
          <h1 className="mb-2 text-4xl font-bold text-white">Legal</h1>
          <p className="text-sm text-[#7b7b7b]">Last updated: {lastUpdated}</p>
        </motion.div>

        {/* ERA Protocol Section */}
        <motion.section className="mb-12" variants={itemVariants}>
          <h2 className="mb-6 text-2xl font-semibold text-white">ERA Protocol</h2>
          
          <motion.div 
            className="flex flex-col gap-6"
            variants={containerVariants}
          >
            {/* Terms of Service */}
            <motion.div variants={itemVariants}>
              <Link href="/terms" className="group flex items-start gap-4">
                <div className="flex shrink-0 items-center justify-center">
                  <FileText className="size-5 text-[#7b7b7b] transition-all group-hover:text-[#a0a0a0] group-hover:opacity-70" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-white transition-colors group-hover:text-[#a0a0a0]">
                    Terms of Service
                  </h3>
                  <p className="text-sm text-[#7b7b7b] transition-colors group-hover:text-[#a0a0a0]">Last updated: {lastUpdated}</p>
                </div>
              </Link>
            </motion.div>

            {/* Privacy Notice */}
            <motion.div variants={itemVariants}>
              <Link href="/privacy" className="group flex items-start gap-4">
                <div className="flex shrink-0 items-center justify-center">
                  <FileText className="size-5 text-[#7b7b7b] transition-all group-hover:text-[#a0a0a0] group-hover:opacity-70" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-white transition-colors group-hover:text-[#a0a0a0]">
                    Privacy Notice
                  </h3>
                  <p className="text-sm text-[#7b7b7b] transition-colors group-hover:text-[#a0a0a0]">Last updated: {lastUpdated}</p>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>
      </motion.div>
    </main>
  );
}
