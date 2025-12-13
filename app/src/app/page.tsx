"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect in progress
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-slate-400">Welcome back! Redirecting...</p>
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
