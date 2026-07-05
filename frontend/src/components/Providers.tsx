"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { PwaBootstrap } from "@/components/PwaBootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <PwaBootstrap />
    </AuthProvider>
  );
}
