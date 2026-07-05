"use client";

import { motion } from "framer-motion";
import { formatUSD, formatToken } from "@/lib/utils";
import { ChainBadge } from "@/components/shared/ChainBadge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@/types";

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
}

const TOKEN_COLORS: Record<string, string> = {
  USDC: "bg-slate-200 text-slate-600",
  ETH: "bg-slate-200 text-slate-600",
  ARB: "bg-slate-200 text-slate-600",
  USDT: "bg-slate-200 text-slate-600",
  WETH: "bg-slate-200 text-slate-600",
};

export function AssetList({ assets, isLoading }: AssetListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No assets yet
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
        Assets
      </h3>
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
        {assets.map((asset, i) => (
          <motion.div
            key={`${asset.symbol}-${asset.chainId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-25 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold ${TOKEN_COLORS[asset.symbol] ?? "bg-slate-200 text-slate-600"}`}>
                {asset.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-slate-900">{asset.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] text-slate-400">{asset.symbol}</span>
                  <span className="text-slate-200">&middot;</span>
                  <ChainBadge chain={asset.chain} />
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[14px] font-semibold text-slate-900 tabular-nums">{formatToken(asset.balance)}</p>
              <p className="text-[12px] text-slate-400 tabular-nums">{formatUSD(asset.balanceUSD)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
