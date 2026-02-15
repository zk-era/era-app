"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Token } from "@/lib/types/swap";

interface TokenSelectorProps {
  selectedToken: Token;
  onSelectToken: (token: Token) => void;
  availableTokens: Token[];
  label?: string;
  subtitle?: string;
  isLoading?: boolean;
}

export function TokenSelector({
  selectedToken,
  onSelectToken,
  availableTokens,
  label = "Select token",
  subtitle,
  isLoading = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = availableTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 transition-opacity hover:opacity-80"
      >
        {selectedToken.logoURI ? (
          <Image
            src={selectedToken.logoURI}
            alt={selectedToken.symbol}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-[#222] font-semibold">
            {selectedToken.symbol[0]}
          </div>
        )}
        <div className="text-left">
          <h2 className="text-base font-semibold">{selectedToken.symbol}</h2>
          <p className="text-sm text-[#7b7b7b]">
            {isLoading
              ? "Loading..."
              : subtitle || `111.82 ${selectedToken.symbol}`}
          </p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute left-0 right-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-2xl border border-[#303030]/50 bg-[#121212] shadow-2xl"
            >
              <div className="border-b border-[#303030]/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-white">{label}</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1 transition-colors hover:bg-[#222]"
                  >
                    <X className="size-4 text-white/50" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search name or address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl bg-[#222] py-2 pl-10 pr-3 text-sm outline-none placeholder:text-white/30 focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {filteredTokens.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/50">
                    No tokens found
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredTokens.map((token) => {
                      const isSelected =
                        token.address === selectedToken.address;

                      return (
                        <button
                          key={token.address}
                          onClick={() => handleSelectToken(token)}
                          className={`flex w-full items-center justify-between rounded-xl p-3 transition-colors ${
                            isSelected ? "bg-green-500/10" : "hover:bg-[#222]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {token.logoURI ? (
                              <Image
                                src={token.logoURI}
                                alt={token.symbol}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="flex size-8 items-center justify-center rounded-full bg-[#222] text-sm font-semibold">
                                {token.symbol[0]}
                              </div>
                            )}
                            <div className="text-left">
                              <div className="font-semibold text-white">
                                {token.symbol}
                              </div>
                              <div className="text-xs text-white/50">
                                {token.address.slice(0, 6)}...
                                {token.address.slice(-4)}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="size-5 text-green-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
