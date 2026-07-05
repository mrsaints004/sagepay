"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, Loader2 } from "lucide-react";
import type { Asset } from "@/types";

interface SendFormProps {
  open: boolean;
  onClose: () => void;
  onSend: (to: string, amount: number, token: string) => Promise<any>;
  assets: Asset[];
}

export function SendForm({ open, onClose, onSend, assets }: SendFormProps) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const tokens = [...new Set(assets.map((a) => a.symbol))];
  if (!tokens.includes("USDC")) tokens.unshift("USDC");
  if (!tokens.includes("ETH")) tokens.push("ETH");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      setError("Invalid address");
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Invalid amount");
      return;
    }

    setIsSending(true);
    try {
      await onSend(to, numAmount, token);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTo("");
        setAmount("");
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white rounded-t-2xl p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-slate-900">Send</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x..."
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 font-mono"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="any"
                    min="0"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
                <div className="w-28">
                  <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
                    Token
                  </label>
                  <select
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 bg-white"
                  >
                    {tokens.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-[12px] text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSending || !to || !amount}
                className="w-full h-12 rounded-xl bg-slate-900 text-white text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  "Sent!"
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </form>

            <div className="h-6" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
