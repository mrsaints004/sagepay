"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Repeat, Link2 } from "lucide-react";

interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

const actions = [
  { icon: ArrowUpRight, label: "Send", prompt: "__send_dialog__" },
  { icon: ArrowDownLeft, label: "Receive", prompt: "What's my balance?" },
  { icon: Repeat, label: "Swap", prompt: "Swap " },
  { icon: Link2, label: "Request", prompt: "Request " },
];

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.04, duration: 0.25 }}
          onClick={() => onAction(action.prompt)}
          className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all active:scale-[0.97]"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 text-white">
            <action.icon className="w-[18px] h-[18px]" />
          </div>
          <span className="text-[12px] font-medium text-slate-600">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
