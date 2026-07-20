"use client";

import { useCallback, useRef } from "react";
import { getUA } from "@/lib/particle";
import { useAuth } from "@/context/AuthContext";

interface PollResult {
  status: "confirmed" | "failed" | "timeout";
  data?: Record<string, unknown>;
}

const POLL_INTERVAL_MS = 3_000;
const TIMEOUT_MS = 5 * 60 * 1_000;

export function useTransactionPoller() {
  const { user } = useAuth();
  const abortRef = useRef<AbortController | null>(null);

  const poll = useCallback(
    async (particleTxId: string): Promise<PollResult> => {
      if (!user.address) return { status: "failed" };

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const ua = getUA(user.address);
      const deadline = Date.now() + TIMEOUT_MS;

      while (Date.now() < deadline) {
        if (controller.signal.aborted) return { status: "failed" };

        try {
          const tx = await ua.getTransaction(particleTxId);
          const status = (tx as { status?: string })?.status?.toLowerCase();

          if (status === "confirmed" || status === "success" || status === "completed") {
            return { status: "confirmed", data: tx };
          }
          if (status === "failed" || status === "error" || status === "rejected") {
            return { status: "failed", data: tx };
          }
        } catch {
          // Transient error, keep polling
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      return { status: "timeout" };
    },
    [user.address]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { poll, cancel };
}
