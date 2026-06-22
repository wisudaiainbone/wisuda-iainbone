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

      {/* Floating Action Menu (Speed Dial) */}
      <div 
        ref={menuRef}
        className={`fixed right-4 bottom-44 md:right-8 md:bottom-28 z-[60] flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${
          isOpen ? "scale-100 opacity-100 visible" : "scale-75 opacity-0 invisible"
        }`}
      >
        {/* We map the children to stack vertically, right-aligned. */}
        <div className="flex flex-col items-end gap-3 [&>*]:w-auto [&_button]:w-auto [&_button]:h-10 [&_button]:px-5 [&_button]:rounded-xl [&_button]:shadow-lg [&_button]:shadow-black/10 [&_span.hidden]:!inline">
          {children}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[70] transition-transform duration-300`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-emerald-600/30 transition-transform ${isOpen ? "rotate-45" : "hover:scale-105 active:scale-95"}`}
          title="Tampilkan Quick Actions"
        >
          {isOpen ? <X size={24} /> : <Sparkles size={24} />}
        </button>
      </div>
    </div>
  );
}
