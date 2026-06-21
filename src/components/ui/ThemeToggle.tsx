"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle({ isScrolled = true }: { isScrolled?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-10 h-10" />;

  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark/light mode"
      className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer bg-slate-100 dark:bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-emerald-700 text-[var(--color-text)]"
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.25 }}
          >
            <Sun size={16} className="text-emerald-600" />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.25 }}
          >
            <Moon size={16} className="text-slate-500" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
