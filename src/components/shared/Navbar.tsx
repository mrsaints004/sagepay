"use client";

import { useAuth } from "@/context/AuthContext";
import { truncateAddress } from "@/lib/utils";
import { LogOut, Copy, Check, Shield, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function Navbar({ isDelegated }: { isDelegated?: boolean }) {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (user.address) {
      try {
        await navigator.clipboard.writeText(user.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API not available (e.g. iframe, permissions)
      }
    }
  };

  return (
    <nav className="flex items-center justify-between px-5 h-14 border-b border-slate-100 bg-white">
      <span className="text-[15px] font-semibold tracking-tight text-slate-900">
        SagePay
      </span>

      <div className="flex items-center gap-2">
        {user.address && (
          <button
            onClick={copyAddress}
            aria-label="Copy wallet address"
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-slate-50 border border-slate-200 text-[12px] font-mono text-slate-500 hover:border-slate-300 transition-colors"
          >
            {isDelegated ? (
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
            ) : (
              <Shield className="w-3 h-3 text-slate-400" />
            )}
            {truncateAddress(user.address)}
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400" />
            )}
          </button>
        )}
        <button
          onClick={logout}
          aria-label="Log out"
          className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
