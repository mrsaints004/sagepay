"use client";

import { useRef, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { useChat } from "@/hooks/useChat";

interface ChatContainerProps {
  prefillPrompt?: string;
  onPrefillUsed?: () => void;
}

export function ChatContainer({ prefillPrompt, onPrefillUsed }: ChatContainerProps) {
  const {
    messages,
    isProcessing,
    pendingConfirmation,
    sendMessage,
    confirmTransaction,
    cancelTransaction,
  } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [consumedPrefill, setConsumedPrefill] = useState<string | undefined>(undefined);

  // Derive input value from prefill without an effect
  // When prefillPrompt changes and hasn't been consumed, apply it
  const activePrefill = prefillPrompt && prefillPrompt !== consumedPrefill ? prefillPrompt : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (message: string) => {
    sendMessage(message);
    setInputValue("");
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
  };

  // Apply prefill on first render of chat tab with a prefill
  const displayValue = activePrefill ?? inputValue;

  const handleSendWithPrefill = (message: string) => {
    if (activePrefill) {
      setConsumedPrefill(prefillPrompt);
      onPrefillUsed?.();
    }
    handleSend(message);
  };

  const handleChangeWithPrefill = (val: string) => {
    if (activePrefill) {
      setConsumedPrefill(prefillPrompt);
      onPrefillUsed?.();
    }
    handleInputChange(val);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={(prompt) => {
            handleSend(prompt);
          }} />
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
        )}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-100">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {pendingConfirmation && (
          <div className="flex gap-2 justify-start">
            <button
              onClick={confirmTransaction}
              className="h-9 px-5 rounded-xl bg-emerald-500 text-white text-[13px] font-medium hover:bg-emerald-600 transition-colors active:scale-[0.97]"
            >
              Confirm
            </button>
            <button
              onClick={cancelTransaction}
              className="h-9 px-5 rounded-xl border border-slate-200 text-slate-500 text-[13px] font-medium hover:bg-slate-50 hover:text-slate-700 transition-colors active:scale-[0.97]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <ChatInput
        value={displayValue}
        onChange={handleChangeWithPrefill}
        onSend={handleSendWithPrefill}
        isProcessing={isProcessing}
      />
    </div>
  );
}
