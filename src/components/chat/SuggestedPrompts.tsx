"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Repeat, CreditCard, Wallet, Zap, Layers } from "lucide-react";

const prompts = [
  { text: "What's my balance?", icon: Wallet },
  { text: "Send 100 USDC to 0x...", icon: ArrowUpRight },
  { text: "Swap 50 USDC to ETH", icon: Repeat },
  { text: "Pay Netflix", icon: CreditCard },
  { text: "Move funds to cheapest chain", icon: Zap },
  { text: "Show cross-chain assets", icon: Layers },
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <p className="text-[15px] font-medium text-slate-900 mb-1">How can I help?</p>
      <p className="text-[13px] text-slate-400 mb-6">Try one of these to get started</p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {prompts.map((prompt, i) => {
          const Icon = prompt.icon;
          return (
            <motion.button
              key={prompt.text}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              onClick={() => onSelect(prompt.text)}
              className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-slate-150 text-[13px] text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]"
            >
              <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {prompt.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
