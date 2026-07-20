"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Loader2, Copy, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RequestFormProps {
  open: boolean;
  onClose: () => void;
}

export function RequestForm({ open, onClose }: RequestFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [memo, setMemo] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setToken("USDC");
      setMemo("");
      setError("");
      setLinkUrl("");
      setCopied(false);
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

    setIsCreating(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAddress: user.address,
          creatorEmail: user.email,
          amount: numAmount,
          token,
          memo: memo.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create link");
      const link = await res.json();
      const url = `${window.location.origin}/pay/${link.id}`;
      setLinkUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
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
              <h3 className="text-[16px] font-semibold text-slate-900">Request Payment</h3>
              <button
                onClick={onClose}
                aria-label="Close request form"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {linkUrl ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <Link2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-emerald-800 mb-1">Link created</p>
                  <p className="text-xs text-emerald-600">{amount} {token}{memo ? ` — "${memo}"` : ""}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={linkUrl}
                    className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-[13px] text-slate-600 bg-slate-50 font-mono truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors active:scale-[0.96]"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-xl border border-slate-200 text-[14px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      autoFocus
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
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-slate-500 mb-1.5 block">
                    Memo (optional)
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="e.g. dinner, rent, tickets..."
                    maxLength={200}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isCreating || !amount}
                  className="w-full h-12 rounded-xl bg-slate-900 text-white text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Create Link
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="h-6" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
