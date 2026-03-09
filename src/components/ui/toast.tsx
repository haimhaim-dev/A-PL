"use client";

import * as React from "react";
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toast 알림 컴포넌트 (shadcn/ui 스타일)
 */

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const toastStyles = {
  success: "border-green-500/50 bg-green-500/10 text-green-400",
  error: "border-red-500/50 bg-red-500/10 text-red-400",
  warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  info: "border-blue-500/50 bg-blue-500/10 text-blue-400"
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const Icon = toastIcons[type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-full",
        toastStyles[type]
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="text-xs text-slate-300">{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="shrink-0 rounded-lg p-1 hover:bg-white/10 transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, "onClose">>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 md:bottom-4 md:right-4">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
