"use client";

import { motion } from "framer-motion";
import { formatUSD } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";
import { useState } from "react";

interface BalanceCardProps {
  totalUSD: number;
  isLoading: boolean;
  onRefresh: () => void;
  isDelegated?: boolean;
}

export function BalanceCard({ totalUSD, isLoading, onRefresh, isDelegated }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl bg-slate-900 text-white p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-slate-400 font-medium">Total balance</span>
          {isDelegated && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              EIP-7702
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            aria-label="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-10 w-48 bg-slate-700 rounded-lg" />
      ) : (
        <motion.h2
          key={totalUSD}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[36px] font-bold tracking-tight leading-none"
        >
          {hidden ? "••••••" : formatUSD(totalUSD)}
        </motion.h2>
      )}

      <p className="text-[13px] text-slate-500 mt-3">
        Unified across all chains
      </p>
    </motion.div>
  );
}
