"use client";

import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "@/types";
import { TransactionStatus } from "./TransactionStatus";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-slate-900 text-white rounded-br-md"
            : "bg-slate-100 text-slate-800 rounded-bl-md"
        }`}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{message.content}</p>
        {message.txStatus && <TransactionStatus status={message.txStatus} />}
      </div>
    </motion.div>
  );
}
