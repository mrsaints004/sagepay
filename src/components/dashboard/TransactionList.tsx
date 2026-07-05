"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Repeat, Inbox, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUA } from "@/lib/particle";
import { Skeleton } from "@/components/ui/skeleton";

interface TxRecord {
  id: string;
  type: "send" | "receive" | "swap";
  amount: string;
  token: string;
  to?: string;
  timestamp: string;
}

const typeConfig = {
  send: { icon: ArrowUpRight, prefix: "-", label: "Sent", color: "text-slate-900" },
  receive: { icon: ArrowDownLeft, prefix: "+", label: "Received", color: "text-emerald-600" },
  swap: { icon: Repeat, prefix: "", label: "Swapped", color: "text-slate-900" },
};

interface RawTransaction {
  sender?: string;
  receiver?: string;
  mode?: string;
  totalDepositTokenAmountInUSD?: string;
  tag?: string;
  createdAt?: string;
  transactionId?: string;
  id?: string;
}

function classifyTx(tx: RawTransaction, ownerAddress: string): TxRecord {
  const sender = (tx.sender ?? "").toLowerCase();
  const receiver = (tx.receiver ?? "").toLowerCase();
  const owner = ownerAddress.toLowerCase();
  const mode = (tx.mode ?? "").toLowerCase();

  let type: "send" | "receive" | "swap" = "send";
  if (mode === "buy" || mode === "sell" || mode === "convert") {
    type = "swap";
  } else if (receiver === owner && sender !== owner) {
    type = "receive";
  }

  const amountUSD = tx.totalDepositTokenAmountInUSD ?? "0";
  const tag = tx.tag ?? "";

  const elapsed = Date.now() - new Date(tx.createdAt ?? Date.now()).getTime();
  let timestamp: string;
  if (elapsed < 3600_000) timestamp = `${Math.floor(elapsed / 60_000)}m ago`;
  else if (elapsed < 86_400_000) timestamp = `${Math.floor(elapsed / 3_600_000)}h ago`;
  else timestamp = `${Math.floor(elapsed / 86_400_000)}d ago`;

  return {
    id: tx.transactionId ?? tx.id ?? String(Math.random()),
    type,
    amount: parseFloat(amountUSD).toFixed(2),
    token: tag || "USD",
    to: type === "send" ? `${receiver.slice(0, 6)}...${receiver.slice(-4)}` : undefined,
    timestamp,
  };
}

interface TransactionListProps {
  onTryFirstPayment?: () => void;
}

export function TransactionList({ onTryFirstPayment }: TransactionListProps) {
  const { user } = useAuth();
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user.address) return;

    let cancelled = false;

    async function load() {
      try {
        const ua = getUA(user.address!);
        const result = await ua.getTransactions(1, 10);
        const raw = result as RawTransaction[] | { transactions?: RawTransaction[]; data?: RawTransaction[] };
        const items: RawTransaction[] = Array.isArray(raw) ? raw : (raw?.transactions ?? raw?.data ?? []);

        if (!cancelled) {
          setTxs(items.map((tx) => classifyTx(tx, user.address!)));
        }
      } catch {
        if (!cancelled) {
          setTxs([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user.address]);

  if (isLoading) {
    return (
      <div>
        <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Recent activity
        </h3>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (txs.length === 0) {
    return (
      <div>
        <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
          Recent activity
        </h3>
        <div className="flex flex-col items-center py-8 text-slate-400">
          <Inbox className="w-8 h-8 mb-2 text-slate-300" />
          <p className="text-sm mb-3">No transactions yet</p>
          {onTryFirstPayment && (
            <button
              onClick={onTryFirstPayment}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-medium hover:bg-slate-800 transition-colors active:scale-[0.98]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Try your first cross-chain payment
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">
        Recent activity
      </h3>
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
        {txs.map((tx, i) => {
          const config = typeConfig[tx.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className="flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-200 text-slate-600">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <span className="text-[14px] font-semibold text-slate-900">{config.label}</span>
                  {tx.to && <p className="text-[12px] text-slate-400 mt-0.5">to {tx.to}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[14px] font-semibold tabular-nums ${config.color}`}>
                  {config.prefix}${tx.amount}
                </p>
                <p className="text-[12px] text-slate-400">{tx.timestamp}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
