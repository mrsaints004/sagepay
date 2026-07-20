"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { formatUSD } from "@/lib/utils";
import { ShareButton } from "@/components/shared/ShareButton";
import type { PaymentLink } from "@/types";
import { Link2, Clock, CheckCircle2 } from "lucide-react";

export function LinkList() {
  const { user } = useAuth();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchLinks() {
      if (!user.address) return;
      setFetchError(false);
      try {
        const res = await fetch(`/api/links?address=${user.address}`);
        if (res.ok) {
          const data = await res.json();
          setLinks(data.items ?? data);
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchLinks();
  }, [user.address]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-white border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Link2 className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">Failed to load links</p>
        <button
          onClick={() => { setLoading(true); setFetchError(false); }}
          className="text-xs text-indigo-600 hover:text-indigo-700 mt-1"
        >
          Tap to retry
        </button>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Link2 className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600 mb-1">No payment links yet</p>
        <p className="text-xs text-slate-400 max-w-[220px]">
          Use the chat to create one: &ldquo;Request $25 for dinner&rdquo;
        </p>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-3">
      {links.map((link, i) => (
        <motion.div
          key={link.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              link.status === "paid" ? "bg-emerald-50" : "bg-amber-50"
            }`}
          >
            {link.status === "paid" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Clock className="w-5 h-5 text-amber-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {formatUSD(link.amount)}
              </span>
              <span className="text-xs text-slate-400">{link.token}</span>
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  link.status === "paid"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {link.status === "paid" ? "Paid" : "Pending"}
              </span>
            </div>
            {link.memo && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{link.memo}</p>
            )}
          </div>

          {link.status === "pending" && (
            <ShareButton url={`${baseUrl}/pay/${link.id}`} />
          )}
        </motion.div>
      ))}
    </div>
  );
}
