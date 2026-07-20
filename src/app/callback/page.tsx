"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import * as Sentry from "@sentry/nextjs";

export default function CallbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  // Once AuthContext picks up the session from Magic, redirect
  useEffect(() => {
    if (user.isLoggedIn) {
      router.push("/dashboard");
    }
  }, [user.isLoggedIn, router]);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      try {
        const { getMagic } = await import("@/lib/magic");
        const magic = getMagic();
        await magic.oauth2.getRedirectResult();
        // AuthContext will detect the session and update state,
        // which triggers the redirect above
        if (!user.isLoggedIn) {
          // Fallback: redirect after a short delay if AuthContext hasn't picked it up
          setTimeout(() => router.push("/dashboard"), 1500);
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { action: "oauth_callback" } });
        console.error("OAuth callback error:", err);
        setError("Login failed. Please try again.");
        setTimeout(() => router.push("/"), 3000);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
