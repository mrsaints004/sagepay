"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { ChainBadge } from "@/components/shared/ChainBadge";
import { formatUSD } from "@/lib/utils";

interface PaymentSuccessProps {
  amount: number;
  token: string;
  txHash: string | null;
  chain: string | null;
}

const EXPLORER_URLS: Record<string, string> = {
  "Arbitrum Sepolia": "https://sepolia.arbiscan.io",
  "Ethereum Sepolia": "https://sepolia.etherscan.io",
  "Base Sepolia": "https://sepolia.basescan.org",
  "Arbitrum One": "https://arbiscan.io",
  Ethereum: "https://etherscan.io",
  Base: "https://basescan.org",
};

export function PaymentSuccess({ amount, token, txHash, chain }: PaymentSuccessProps) {
  const explorerBase = EXPLORER_URLS[chain ?? ""] ?? "https://sepolia.arbiscan.io";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="px-5 h-14 flex items-center border-b border-slate-100">
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">SagePay</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center max-w-sm"
        >
          {/* Checkmark circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
            className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </motion.div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Sent</h1>
          <p className="text-lg text-slate-600 mb-6">
            {formatUSD(amount)} {token}
          </p>

          {chain && (
            <div className="flex justify-center mb-4">
              <ChainBadge chain={chain} />
            </div>
          )}

          {txHash && txHash !== "no-op" && (
            <a
              href={`${explorerBase}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              View transaction
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex h-10 px-6 items-center rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Go to SagePay
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
