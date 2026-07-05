"use client";

import { useAuth } from "@/context/AuthContext";

export function useMagicAuth() {
  return useAuth();
}
