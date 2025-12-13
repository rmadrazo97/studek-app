"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/stores/auth";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { DebugConsole } from "@/components/debug";
import { CapacitorProvider } from "@/components/capacitor/CapacitorProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <CapacitorProvider>
      <AuthProvider>
        {children}
        <InstallPrompt />
        <DebugConsole />
      </AuthProvider>
    </CapacitorProvider>
  );
}
