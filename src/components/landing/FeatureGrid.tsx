"use client";

import { motion } from "framer-motion";
import { MessageSquare, Repeat, Wallet, ShieldCheck, Fuel, Link2 } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "EIP-7702 Upgrade",
    description: "Your EOA becomes a smart account in-place. No separate contract deployment.",
  },
  {
    icon: Repeat,
    title: "Cross-Chain Routing",
    description: "Assets routed across Arbitrum, Base, and Ethereum for best execution.",
  },
  {
    icon: Fuel,
    title: "Universal Gas",
    description: "Pay gas in any token on any chain. No bridging or manual top-ups.",
  },
  {
    icon: MessageSquare,
    title: "Chat to Pay",
    description: "Just type what you want. Our AI handles the rest.",
  },
  {
    icon: Wallet,
    title: "Unified Balance",
    description: "One balance across all chains. See and spend from anywhere.",
  },
  {
    icon: Link2,
    title: "Payment Links",
    description: "Create shareable links to request cross-chain payments from anyone.",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 px-6 pb-12 max-w-md mx-auto">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
          className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
        >
          <feature.icon className="w-5 h-5 text-indigo-500 mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">{feature.title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
