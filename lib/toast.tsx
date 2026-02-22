"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right ${
            toast.type === "success"
              ? "bg-green-500/20 border-green-500/50 text-green-400"
              : toast.type === "error"
                ? "bg-red-500/20 border-red-500/50 text-red-400"
                : toast.type === "warning"
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                  : "bg-blue-500/20 border-blue-500/50 text-blue-400"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5" />}
          {toast.type === "error" && <XCircle className="w-5 h-5" />}
          {toast.type === "warning" && <AlertCircle className="w-5 h-5" />}
          {toast.type === "info" && <Info className="w-5 h-5" />}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
