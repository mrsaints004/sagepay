"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { HeroSection } from "@/components/landing/HeroSection";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user.isLoggedIn) {
      router.push("/dashboard");
    }
  }, [user.isLoggedIn, router]);

  if (user.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (user.isLoggedIn) return null;

  return <HeroSection />;
}
