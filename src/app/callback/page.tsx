"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      try {
        const { getMagic } = await import("@/lib/magic");
        const magic = getMagic();
        await magic.oauth2.getRedirectResult();
        router.push("/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Login failed. Please try again.");
        setTimeout(() => router.push("/"), 3000);
      }
    })();
  }); // no deps — runs once via ref guard

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-white">
        <p className="text-red-500 text-sm font-medium">{error}</p>
        <p className="text-slate-400 text-xs">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-white">
      <LoadingSpinner />
      <p className="text-slate-400 text-sm">Completing login...</p>
    </div>
  );
}
