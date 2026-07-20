"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";
import type { UserState } from "@/types";

interface AuthContextValue {
  user: UserState;
  login: (method: "google" | "email", email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState>({
    address: null,
    isLoggedIn: false,
    isLoading: true,
  });
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    (async () => {
      try {
        const key = process.env.NEXT_PUBLIC_MAGIC_API_KEY;
        if (!key || key.includes("YOUR_") || key.length < 10) {
          setUser((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const { getMagic } = await import("@/lib/magic");
        const magic = getMagic();

        const isLoggedIn = await Promise.race([
          magic.user.isLoggedIn(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          ),
        ]);

        if (isLoggedIn) {
          try {
            const metadata = await magic.user.getInfo();
            const accounts = (await magic.rpcProvider.request({ method: "eth_accounts" })) as string[];
            if (accounts[0]) {
              Sentry.setUser({ id: accounts[0], email: metadata.email ?? undefined });
              setUser({
                address: accounts[0],
                isLoggedIn: true,
                isLoading: false,
                email: metadata.email ?? undefined,
              });
            } else {
              await magic.user.logout().catch(() => {});
              setUser((prev) => ({ ...prev, isLoading: false }));
            }
          } catch {
            await magic.user.logout().catch(() => {});
            setUser((prev) => ({ ...prev, isLoading: false }));
          }
        } else {
          setUser((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        setUser((prev) => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (method: "google" | "email", email?: string) => {
    setUser((prev) => ({ ...prev, isLoading: true }));

    try {
      const { getMagic } = await import("@/lib/magic");
      const magic = getMagic();

      if (method === "google") {
        await magic.oauth2.loginWithRedirect({
          provider: "google",
          redirectURI: `${window.location.origin}/callback`,
        });
        return;
      }

      if (method === "email" && email) {
        await magic.auth.loginWithEmailOTP({ email });
        const metadata = await magic.user.getInfo();
        const accounts = (await magic.rpcProvider.request({ method: "eth_accounts" })) as string[];
        Sentry.setUser({ id: accounts[0] ?? undefined, email: metadata.email ?? undefined });
        setUser({
          address: accounts[0] ?? null,
          isLoggedIn: true,
          isLoading: false,
          email: metadata.email ?? undefined,
        });
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "login", method } });
      setUser((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { getMagic } = await import("@/lib/magic");
      const magic = getMagic();
      await magic.user.logout();
    } catch {
      // Ignore logout errors
    }
    Sentry.setUser(null);
    setUser({ address: null, isLoggedIn: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
