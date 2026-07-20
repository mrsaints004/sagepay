"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Repeat, Loader2 } from "lucide-react";
import type { Asset } from "@/types";

interface SwapFormProps {
  open: boolean;
  onClose: () => void;
  onSwap: (amount: number, fromToken: string, toToken: string) => Promise<void>;
  assets: Asset[];
}

export function SwapForm({ open, onClose, onSwap, assets }: SwapFormProps) {
  const [amount, setAmount] = useState("");
  const [fromToken, setFromToken] = useState("USDC");
  const [toToken, setToToken] = useState("ETH");
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const tokens = [...new Set(assets.map((a) => a.symbol))];
  if (!tokens.includes("USDC")) tokens.unshift("USDC");
  if (!tokens.includes("ETH")) tokens.push("ETH");

  useEffect(() => {
    if (open) {
      setAmount("");
      setFromToken("USDC");
      setToToken("ETH");
      setError("");
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (fromToken === toToken) {
      setError("Select different tokens");
      return;
    }

    setIsSwapping(true);
    try {
      await onSwap(numAmount, fromToken, toToken);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap failed");
    } finally {
      setIsSwapping(false);
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
              <h3 className="text-[16px] font-semibold text-slate-900">Swap</h3>
              <button
                onClick={onClose}
                aria-label="Close swap form"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
                  Amount (USD value)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  autoFocus
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
                    From
                  </label>
                  <select
                    value={fromToken}
                    onChange={(e) => setFromToken(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 bg-white"
                  >
                    {tokens.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center w-10 h-11">
                  <Repeat className="w-4 h-4 text-slate-400" />
                </div>

                <div className="flex-1">
                  <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
                    To
                  </label>
                  <select
                    value={toToken}
                    onChange={(e) => setToToken(e.target.value)}
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
                disabled={isSwapping || !amount}
                className="w-full h-12 rounded-xl bg-slate-900 text-white text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {isSwapping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  "Swap submitted!"
                ) : (
                  <>
                    <Repeat className="w-4 h-4" />
                    Swap
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
