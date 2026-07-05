"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useUniversalAccount } from "@/hooks/useUniversalAccount";
import { formatUSD, truncateAddress } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { PaymentSuccess } from "./PaymentSuccess";
import type { PaymentLink } from "@/types";
import { DollarSign, Mail, FileText, LogIn } from "lucide-react";

interface PaymentPageProps {
  linkId: string;
}

export function PaymentPage({ linkId }: PaymentPageProps) {
  const { user, login } = useAuth();
  const { balance, sendTransaction } = useUniversalAccount();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [paidChain, setPaidChain] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/links/${linkId}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Payment link not found." : "Failed to load payment link.");
          return;
        }
        const data = await res.json();
        setLink(data);
        if (data.status === "paid") {
          setPaid(true);
          setTxHash(data.txHash || null);
          setPaidChain(data.paidFromChain || null);
        }
      } catch {
        setError("Failed to load payment link.");
      } finally {
        setLoading(false);
      }
    }
    fetchLink();
  }, [linkId]);

  const handlePay = useCallback(async () => {
    if (!link || !user.address) return;
    setPaying(true);

    try {
      const result = await sendTransaction(
        link.creatorAddress,
        link.amount,
        link.token
      );

      // Mark link as paid
      await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paidBy: user.address,
          paidFromChain: result.settlementChain || "Arbitrum Sepolia",
          txHash: result.txId,
        }),
      });

      setTxHash(result.txId);
      setPaidChain(result.settlementChain || "Arbitrum Sepolia");
      setPaid(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }, [link, user.address, sendTransaction, linkId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !link) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 mb-2">Oops</h1>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!link) return null;

  if (paid) {
    return <PaymentSuccess amount={link.amount} token={link.token} txHash={txHash} chain={paidChain} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 h-14 flex items-center border-b border-slate-100">
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">SagePay</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Amount card */}
          <div className="bg-slate-50 rounded-3xl p-8 text-center mb-6 border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto mb-5">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-500 mb-1">Payment Request</p>
            <p className="text-4xl font-bold text-slate-900 mb-1">
              {formatUSD(link.amount)}
            </p>
            <p className="text-sm text-slate-400">{link.token}</p>

            {link.memo && (
              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-600">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>&ldquo;{link.memo}&rdquo;</span>
              </div>
            )}

            {link.creatorEmail && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5" />
                <span>Requested by {link.creatorEmail}</span>
              </div>
            )}
            {!link.creatorEmail && (
              <div className="mt-3 text-xs text-slate-400">
                Requested by {truncateAddress(link.creatorAddress)}
              </div>
            )}
          </div>

          {/* Auth / Pay section */}
          {!user.isLoggedIn ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-slate-500 mb-4">
                Log in to pay from any chain
              </p>
              <button
                onClick={() => login("google")}
                className="w-full h-12 rounded-2xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Continue with Google
              </button>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="or enter email"
                  className="flex-1 h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none focus:border-slate-400 transition-colors"
                />
                <button
                  onClick={() => emailInput && login("email", emailInput)}
                  disabled={!emailInput}
                  className="h-12 px-5 rounded-2xl bg-slate-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-slate-800 transition-colors"
                >
                  Go
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Balance preview */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-400 mb-2">Your balance</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatUSD(balance.totalUSD)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Across {balance.assets.length} asset{balance.assets.length !== 1 ? "s" : ""}
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <button
                onClick={handlePay}
                disabled={paying || balance.totalUSD < link.amount}
                className="w-full h-12 rounded-2xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <LoadingSpinner />
                    <span>Processing...</span>
                  </>
                ) : balance.totalUSD < link.amount ? (
                  "Insufficient balance"
                ) : (
                  `Pay ${formatUSD(link.amount)}`
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Settled via Particle Universal Account — pay from any chain
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
