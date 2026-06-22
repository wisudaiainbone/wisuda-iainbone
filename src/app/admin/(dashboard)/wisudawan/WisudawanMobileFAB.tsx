"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X } from "lucide-react";

export default function WisudawanMobileFAB({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <div className="xl:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet Menu */}
      <div 
        ref={menuRef}
        className={`fixed left-0 right-0 bottom-0 z-[70] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] shadow-2xl transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex flex-col p-5 pb-8 max-h-[85vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
              <Sparkles className="text-emerald-500" size={20} />
              Quick Actions
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] rounded-full text-[var(--color-text-muted)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="overflow-y-auto hide-scrollbar flex flex-col gap-3 pb-safe">
            {/* We map the children to stretch fully. The buttons are passed from WisudawanSearch */}
            <div className="flex flex-col gap-3 w-full [&>*]:w-full [&_button]:w-full [&_button]:h-12 [&_button]:text-base [&_button]:justify-start [&_button]:px-4 [&_span.hidden]:!inline">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[50] transition-transform duration-300 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
          title="Tampilkan Quick Actions"
        >
          <Sparkles size={24} />
        </button>
      </div>
    </div>
  );
}
