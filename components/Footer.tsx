import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-6">
      <div className="flex items-center justify-between px-6 text-sm text-[#7b7b7b]">
        {/* Left: Copyright */}
        <div>
          © 2026 ERA Protocol
        </div>

        {/* Center: Warning */}
        <div className="absolute left-1/2 -translate-x-1/2 text-xs text-[#666]">
          Use burner wallets only · Testnet funds only
        </div>

        {/* Right: Legal Link */}
        <div>
          <Link href="/legal" className="transition-colors hover:text-white">
            Legal
          </Link>
        </div>
      </div>
    </footer>
  );
}
