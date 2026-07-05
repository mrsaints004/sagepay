"use client";

import { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isProcessing: boolean;
  initialValue?: string;
}

export function ChatInput({ onSend, isProcessing, initialValue = "" }: ChatInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isProcessing) {
      onSend(value.trim());
      setValue("");
    }
  };

  if (initialValue && value !== initialValue) {
    setValue(initialValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-white"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Send a message..."
        disabled={isProcessing}
        className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={!value.trim() || isProcessing}
        className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white disabled:opacity-20 hover:bg-slate-800 transition-colors active:scale-[0.96]"
      >
        <ArrowUp className="w-[18px] h-[18px]" />
      </button>
    </form>
  );
}
