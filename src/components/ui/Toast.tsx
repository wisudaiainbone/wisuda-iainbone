"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (title: string, type?: ToastType, message?: string) => void;
}

/* ─── Context ───────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ─── Config ────────────────────────────────────────── */
const CONFIG: Record<
  ToastType,
  {
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    border: string;
    cardBg: string;
    progressColor: string;
  }
> = {
  success: {
    icon: <CheckCircle2 size={32} strokeWidth={1.5} />,
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
    titleColor: "text-emerald-500 dark:text-emerald-400",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    cardBg: "bg-white dark:bg-[#0d1f1a]",
    progressColor: "bg-emerald-500",
  },
  error: {
    icon: <XCircle size={32} strokeWidth={1.5} />,
    iconBg: "bg-rose-500",
    iconColor: "text-white",
    titleColor: "text-rose-500 dark:text-rose-400",
    border: "border-rose-200/60 dark:border-rose-800/40",
    cardBg: "bg-white dark:bg-[#1f0d0d]",
    progressColor: "bg-rose-500",
  },
  info: {
    icon: <AlertCircle size={32} strokeWidth={1.5} />,
    iconBg: "bg-blue-500",
    iconColor: "text-white",
    titleColor: "text-blue-500 dark:text-blue-400",
    border: "border-blue-200/60 dark:border-blue-800/40",
    cardBg: "bg-white dark:bg-[#0d1020]",
    progressColor: "bg-blue-500",
  },
};

const DURATION = 3200; // ms

/* ─── Single Toast Card ─────────────────────────────── */
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const cfg = CONFIG[item.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.88, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 12 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={`relative w-[290px] sm:w-[320px] rounded-2xl border-black/20 overflow-hidden ${cfg.cardBg} ${cfg.border}`}
    >
      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
      >
        <X size={12} className="text-[var(--color-text-muted)]" />
      </button>

      {/* Content */}
      <div className="flex flex-col items-center text-center px-5 pt-6 pb-5 gap-3">
        {/* Icon circle */}
        <div className={`w-14 h-14 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center`}>
          {cfg.icon}
        </div>

        {/* Divider */}
        <div className={`w-12 h-px ${cfg.progressColor} opacity-40`} />

        {/* Text */}
        <div className="flex flex-col gap-1">
          <p className={`text-sm font-bold leading-snug ${cfg.titleColor}`}>{item.title}</p>
          {item.message && (
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{item.message}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-[3px] ${cfg.progressColor} opacity-70`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: DURATION / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

/* ─── Provider ──────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, type: ToastType = "success", message?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev.slice(-2), { id, type, title, message }]);
      const timer = setTimeout(() => dismiss(id), DURATION);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Portal: center-bottom overlay */}
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => (
            <div key={item.id} className="pointer-events-auto">
              <ToastCard item={item} onDismiss={() => dismiss(item.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
