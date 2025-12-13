"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { Loader2 } from "lucide-react";
import { isNativePlatform } from "@/lib/capacitor/native";
import {
  Navigation,
  Hero,
  SocialProof,
  PainSolution,
  Features,
  Pricing,
  FAQ,
  Footer,
  StickyCTA,
} from "@/components/landing";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check if running in native app
    setIsNative(isNativePlatform());
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Authenticated users go to dashboard
        router.push("/dashboard");
      } else if (isNative) {
        // Native app users go directly to login (skip landing page)
        router.push("/login");
      }
    }
  }, [isLoading, isAuthenticated, isNative, router]);

  // Show loading while checking auth or redirecting
  if (isLoading || isAuthenticated || isNative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-slate-400">
            {isAuthenticated ? "Welcome back! Redirecting..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090a]">
      <Navigation />
      <Hero />
      <SocialProof />
      <PainSolution />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />
      <StickyCTA />
    </main>
  );
}
