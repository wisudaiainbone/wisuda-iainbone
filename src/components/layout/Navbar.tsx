"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-[var(--color-bg)]/90 backdrop-blur-xl border-b border-[var(--color-border)] shadow-sm"
          : "bg-transparent border-b border-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="#beranda" className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image src="/logo.png" alt="Logo IAIN Bone" width={32} height={32} className="object-contain" />
              </div>
              <p className="text-sm font-semibold tracking-tight transition-colors duration-300 font-[var(--font-outfit)] text-[var(--color-text)]">
                Wisuda IAIN Bone
              </p>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
            </div>

            {/* Right: Theme + Login */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle isScrolled={isScrolled} />
              <Link
                href="/auth"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 bg-emerald-900 text-white hover:bg-emerald-950 shadow-sm"
              >
                <GraduationCap size={16} className="-mr-0.5" />
                Login
              </Link>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle isScrolled={isScrolled} />
            </div>
          </div>
        </div>
      </motion.nav>

    </>
  );
}
