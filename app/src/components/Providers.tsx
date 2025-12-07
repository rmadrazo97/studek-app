"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/stores/auth";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <InstallPrompt />
    </AuthProvider>
  );
}
