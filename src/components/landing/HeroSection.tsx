"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, Mail } from "lucide-react";
import { FeatureGrid } from "./FeatureGrid";

export function HeroSection() {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(false);

  const handleGoogleLogin = () => login("google");
  const handleEmailLogin = () => {
    if (email.trim()) login("email", email);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-white overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-sm w-full"
      >
        <div className="mb-10">
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 mb-2">
            SagePay
          </h1>
          <p className="text-[15px] text-slate-500 leading-relaxed">
            Cross-chain payments powered by EIP-7702.<br />
            Your EOA becomes a smart account — send, swap, and pay with a message.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleGoogleLogin}
            disabled={user.isLoading}
            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-white border border-slate-200 text-[14px] font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-slate-200 text-[14px] font-medium text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <Mail className="w-4 h-4" />
              Continue with email
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                autoFocus
                className="w-full h-12 px-4 rounded-xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all"
              />
              <button
                onClick={handleEmailLogin}
                disabled={!email.trim() || user.isLoading}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-900 text-white text-[14px] font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>

        <p className="text-center text-[12px] text-slate-400 mt-8 mb-8">
          Powered by Particle Network &middot; EIP-7702 &middot; Arbitrum
        </p>
      </motion.div>

      <FeatureGrid />
    </div>
  );
}
