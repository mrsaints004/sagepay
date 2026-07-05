"use client";

const CHAIN_COLORS: Record<string, string> = {
  "Arbitrum Sepolia": "bg-blue-50 text-blue-600",
  "Ethereum Sepolia": "bg-slate-100 text-slate-600",
  "Base Sepolia": "bg-sky-50 text-sky-600",
  "Arbitrum One": "bg-blue-50 text-blue-600",
  Base: "bg-sky-50 text-sky-600",
  Ethereum: "bg-slate-100 text-slate-600",
  Optimism: "bg-red-50 text-red-500",
  Polygon: "bg-violet-50 text-violet-600",
};

export function ChainBadge({ chain }: { chain: string }) {
  const colors = CHAIN_COLORS[chain] ?? "bg-slate-100 text-slate-500";

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${colors}`}>
      {chain}
    </span>
  );
}
