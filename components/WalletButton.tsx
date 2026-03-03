"use client";

import { useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import makeBlockie from "ethereum-blockies-base64";
import { useChainInfo } from "@/lib/context/ChainContext";

export function WalletButton() {
  const { setChainInfo } = useChainInfo();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        // Sync chain info to context when available
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (connected && chain) {
            setChainInfo(chain.iconUrl, chain.name);
          } else {
            setChainInfo(undefined, undefined);
          }
        }, [connected, chain]);

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-white/90"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  {/* Network button */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    aria-label={`Switch network, currently ${chain.name}`}
                    className="flex items-center gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#252525]"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <Image
                        alt=""
                        aria-hidden="true"
                        src={chain.iconUrl}
                        width={18}
                        height={18}
                        className="rounded-full"
                      />
                    )}
                    <span className="hidden sm:inline" aria-hidden="true">{chain.name}</span>
                  </button>

                  {/* Account button */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    aria-label={`Wallet account ${account.displayName}, balance ${account.displayBalance || 'loading'}`}
                    className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#252525]"
                  >
                    {account.displayBalance && (
                      <span className="text-[#7b7b7b]" aria-hidden="true">{account.displayBalance}</span>
                    )}
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt=""
                        aria-hidden="true"
                        src={account.ensAvatar || makeBlockie(account.address)}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span>{account.displayName}</span>
                    </div>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
