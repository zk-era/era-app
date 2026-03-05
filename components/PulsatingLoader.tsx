"use client";

import { motion } from "framer-motion";

interface PulsatingLoaderProps {
  color?: string;
}

export function PulsatingLoader({ color = "#22d3ee" }: PulsatingLoaderProps) {
  // Convert hex to rgba for box-shadow
  const hexToRgba = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const rgba = hexToRgba(color);

  return (
    <div className="flex items-center justify-center gap-0 pl-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-[5px] h-4"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 6px rgba(${rgba}, 0.8), 0 0 12px rgba(${rgba}, 0.4)`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  );
}
