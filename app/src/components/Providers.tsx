"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/stores/auth";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
