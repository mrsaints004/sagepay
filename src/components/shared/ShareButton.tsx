"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

interface ShareButtonProps {
  url: string;
  variant?: "icon" | "full";
}

export function ShareButton({ url, variant = "icon" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: "SagePay Payment Link" });
        return;
      } catch {
        // User cancelled or not supported, fall through to copy
      }
    }
    copyToClipboard();
  };

  if (variant === "full") {
    return (
      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy Link"}
        </button>
        <button
          onClick={share}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={copyToClipboard}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      title="Copy link"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}
