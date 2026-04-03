"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

type ToastVariant = "error" | "success";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
  showErrorToast: (message: string) => void;
  showSuccessToast: (message: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

type ToastProviderProps = {
  children: ReactNode;
};

function getToastClasses(variant: ToastVariant): string {
  if (variant === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200";
  }

  return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200";
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "error") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast: ToastItem = {
      id,
      message,
      variant,
    };

    setToasts((current) => [...current, nextToast]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const showErrorToast = useCallback(
    (message: string) => {
      showToast(message, "error");
    },
    [showToast],
  );

  const showSuccessToast = useCallback(
    (message: string) => {
      showToast(message, "success");
    },
    [showToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showErrorToast,
      showSuccessToast,
    }),
    [showErrorToast, showSuccessToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-20 z-[100] mx-auto flex w-full max-w-md flex-col gap-2 sm:right-4 sm:left-auto sm:mx-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={[
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-medium transition-opacity duration-200",
              getToastClasses(toast.variant),
            ].join(" ")}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
