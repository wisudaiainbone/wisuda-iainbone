"use client";

import { useState, useEffect } from "react";
import { Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { getSetting } from "@/actions/settings";

export function Footer() {
  const [contactEmail, setContactEmail] = useState("wisuda@iainbone.ac.id");
  const [contactWaLabel, setContactWaLabel] = useState("+62 811 9429 035");
  const [contactWaLink, setContactWaLink] = useState("628119429035");

  useEffect(() => {
    async function fetchContacts() {
      const email = await getSetting('contact_email', 'wisuda@iainbone.ac.id');
      const wa = await getSetting('contact_wa', '+62 811 9429 035');
      setContactEmail(email);
      setContactWaLabel(wa);
      setContactWaLink(wa.replace(/\D/g, ''));
    }
    fetchContacts();
  }, []);
  return (
    <footer className="bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] py-12 sm:py-16 border-t border-[var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo area */}
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-text-subtle)] mb-8">
            Pusat Informasi & Bantuan
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            {/* Email */}
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-emerald-800/30 transition-all duration-200 w-full sm:w-auto group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-800/10 flex items-center justify-center shrink-0">
                <Mail size={15} className="text-emerald-800 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">{contactEmail}</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${contactWaLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] hover:border-emerald-800/30 transition-all duration-200 w-full sm:w-auto group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-800/10 flex items-center justify-center shrink-0">
                <Phone size={14} className="text-emerald-800 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">{contactWaLabel}</span>
            </a>
          </div>

          <p className="text-xs text-[var(--color-text-muted)]">
            Mohon sertakan <strong className="text-[var(--color-text)] font-medium">Nama, NIM, dan Program Studi/Fakultas</strong> saat menghubungi panitia.
          </p>

          <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-subtle)]">© 2026 Institut Agama Islam Negeri Bone. Hak Cipta Dilindungi.</p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
