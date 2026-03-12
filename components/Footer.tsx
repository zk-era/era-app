import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-6">
      <div className="flex flex-col items-center gap-3 px-6 text-sm text-[#7b7b7b] sm:flex-row sm:justify-between sm:gap-0">
        {/* Warning - Appears first on mobile, center on desktop */}
        <div className="order-1 text-center text-xs text-[#666] sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:order-2">
          Use burner wallets only · Testnet funds only
        </div>

        {/* Copyright - Below warning on mobile, left on desktop */}
        <div className="order-2 sm:order-1">
          © 2026 ERA Protocol
        </div>

        {/* Legal Link - Below warning on mobile, right on desktop */}
        <div className="order-3 sm:order-3">
          <Link href="/legal" className="transition-colors hover:text-white">
            Legal
          </Link>
        </div>
      </div>
    </footer>
  );
}
