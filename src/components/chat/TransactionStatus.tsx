"use client";

import { motion } from "framer-motion";
import type { TransactionStatus as TxStatus } from "@/types";
import { truncateAddress } from "@/lib/utils";
import { Check, X, Loader2, ExternalLink, ArrowRight } from "lucide-react";

interface TransactionStatusProps {
  status: TxStatus;
}

export function TransactionStatus({ status }: TransactionStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-2.5 p-3 rounded-xl bg-white/10"
    >
      <div className="flex items-center gap-2">
        {status.state === "pending" && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span className="text-[12px] text-amber-600 font-medium">Processing</span>
          </>
        )}
        {status.state === "confirming" && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            <span className="text-[12px] text-blue-600 font-medium">Confirming</span>
          </>
        )}
        {status.state === "confirmed" && (
          <>
            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-emerald-600" />
            </div>
            <span className="text-[12px] text-emerald-600 font-medium">Confirmed</span>
          </>
        )}
        {status.state === "failed" && (
          <>
            <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
              <X className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-[12px] text-red-600 font-medium">Failed</span>
          </>
        )}
      </div>

      {/* Chain routing visualization */}
      {status.state === "confirmed" &&
        status.sourceChains &&
        status.sourceChains.length > 0 &&
        status.settlementChain && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {status.sourceChains.map((chain, i) => (
              <span
                key={chain}
                className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium"
              >
                {chain}
              </span>
            ))}
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">
              {status.settlementChain}
            </span>
          </div>
        )}

      {status.txHash && (
        <a
          href={`https://sepolia.arbiscan.io/tx/${status.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-2 text-[12px] text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="font-mono">{truncateAddress(status.txHash)}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {status.error && <p className="mt-1 text-[12px] text-red-500">{status.error}</p>}
    </motion.div>
  );
}
