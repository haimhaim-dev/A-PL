"use client";

import type { ReactNode } from "react";
import { ToastProvider, useToast } from "@/hooks/use-toast";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastContainer } from "@/components/ui/toast";

function ToastRenderer() {
  const { toasts, removeToast } = useToast();
  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
        <ToastRenderer />
      </ToastProvider>
    </AuthProvider>
  );
}
