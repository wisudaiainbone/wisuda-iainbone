"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, MapPin, CalendarPlus, Users, UserCheck, UserMinus, Clock, Phone, ChevronLeft, ChevronRight, GraduationCap, Lock, FileText } from "lucide-react";
import { getSetting } from "@/actions/settings";
import { PdfModal } from "@/components/ui/PdfModal";

type Stat = { label: string; value: string; icon: string; color: string; bg: string; details?: { label: string; value: string; }[] };
export type Period = {
  id: any; title: string; status: string; date: string; day: string; location: string; venue: string;
  session1: string; session2: string; statusColor: string; stats: Stat[]; registrationDateLabel: string; hint_pendaftaran?: string; linkPengumuman?: string;
};

const iconMap: Record<string, React.ElementType> = {
  Users,
  UserCheck,
  UserMinus
};

function parseToCalendarDate(dateString: string) {
  if (!dateString) return null;
  const MONTHS: Record<string, string> = {
    'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
    'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
    'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
  };
  const parts = dateString.trim().toLowerCase().split(' ');
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const month = MONTHS[parts[1]] || '01';
    const year = parts[2];
    return `${year}${month}${day}`;
  }
  return null;
}

export function HeroSection({ graduationPeriods }: { graduationPeriods: Period[] }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [activePeriodIdx, setActivePeriodIdx] = useState(0);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [contactEmail, setContactEmail] = useState("wisuda@iainbone.ac.id");
  const [contactWaLabel, setContactWaLabel] = useState("+62 811 9429 035");
  const [contactWaLink, setContactWaLink] = useState("628119429035");
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingBar(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // State for Countdown
  const [timeLeft, setTimeLeft] = useState({ Hari: 0, Jam: 0, Menit: 0, Detik: 0 });
  const [isClient, setIsClient] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    async function fetchContacts() {
      const email = await getSetting('contact_email', 'wisuda@iainbone.ac.id');
      const wa = await getSetting('contact_wa', '+62 811 9429 035');
      setContactEmail(email);
      setContactWaLabel(wa);
      setContactWaLink(wa.replace(/\D/g, ''));
    }
    fetchContacts();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsClient(true);

    const currentPeriod = graduationPeriods[activePeriodIdx];
    let targetDate = 0;

    if (currentPeriod?.registrationDateLabel) {
      const MONTHS: Record<string, number> = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
        'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
        'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
      };
      // Extract last date from e.g. "1 Oktober 2026 - 25 Oktober 2026" or "1 OKTOBER - 25 OKTOBER 2026"
      const str = currentPeriod.registrationDateLabel.toLowerCase();
      // Match last occurrence of "<day> <month_name> <year>" or "<day> <month_name>" (year at end)
      const allMatches = [...str.matchAll(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/g)];
      // Find the year in the whole string
      const yearMatch = str.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      if (allMatches.length > 0) {
        // Take the last date segment as the deadline
        const last = allMatches[allMatches.length - 1];
        const day = parseInt(last[1]);
        const month = MONTHS[last[2]];
        const y = last[3] ? parseInt(last[3]) : year;
        if (!isNaN(day) && month !== undefined && !isNaN(y)) {
          const d = new Date(y, month, day, 23, 59, 59);
          targetDate = d.getTime();
        }
      }
    }

    if (!targetDate || targetDate <= 0) return; // Nothing to count down to

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({ Hari: 0, Jam: 0, Menit: 0, Detik: 0 });
        return;
      }

      setTimeLeft({
        Hari: Math.floor(distance / (1000 * 60 * 60 * 24)),
        Jam: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        Menit: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        Detik: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activePeriodIdx, graduationPeriods]);

  const stats = [
    { label: "Kuota Total", value: "600", icon: Users, color: "text-emerald-700", bg: "bg-emerald-800/20" },
    { label: "Pendaftar", value: "482", icon: UserCheck, color: "text-blue-400", bg: "bg-blue-500/20" },
    { label: "Sisa Kuota", value: "118", icon: UserMinus, color: "text-amber-400", bg: "bg-amber-500/20" },
  ];

  return (
    <section
      id="beranda"
      className="relative min-h-screen flex flex-col items-center justify-center hero-mesh overflow-hidden"
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 text-slate-900 dark:text-white opacity-[0.04] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating blobs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-800/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-[8%] w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-20 pb-28 md:pb-6">

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column Wrapper */}
          <div className="contents lg:flex flex-col justify-start">

            {/* 1. Heading (Mobile: Atas, Desktop: Atas) */}
            <div className="order-1 lg:order-none text-center lg:text-left flex flex-col justify-start">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.2] tracking-tight font-[var(--font-outfit)] pt-6 lg:pt-20"
              >
                Portal Wisuda
                <br />
                <span className="text-emerald-800 dark:text-emerald-600 block mt-2">Institut Agama Islam Negeri Bone</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35 }}
                className="mt-6 text-[var(--color-text-muted)] text-base max-w-lg mx-auto lg:mx-0"
              >
                Persiapkan momen berharga Anda dengan melengkapi seluruh persyaratan yang ada.
              </motion.p>


            </div>

            {/* 3. Kontak Bantuan & Footer (Mobile: Bawah, Desktop: Bawah) */}
            <div className="order-3 lg:order-none flex flex-col text-center lg:text-left w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="mt-8 max-w-lg mx-auto lg:mx-0"
              >
                <p className="text-xs font-bold md:font-normal text-[var(--color-text-subtle)] mb-3">
                  Pusat Informasi & Bantuan
                </p>
                <div className="flex flex-col sm:flex-row w-full lg:justify-start gap-2 sm:gap-3 pb-1 justify-center items-center sm:items-stretch">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="w-full sm:flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-200 group whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <span className="text-xs font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">{contactEmail}</span>
                  </a>
                  <a
                    href={`https://wa.me/${contactWaLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-200 group whitespace-nowrap"
                  >
                    <Phone size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">{contactWaLabel}</span>
                  </a>
                </div>
                <p className="text-xs text-[var(--color-text-subtle)] mt-3 leading-relaxed">
                  Sertakan <span className="font-semibold text-[var(--color-text-muted)]">Nama, NIM, dan Program Studi/Fakultas</span> saat menghubungi panitia.
                </p>
              </motion.div>

              {/* Footer Credit — rata bawah */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-[var(--color-text-subtle)] mt-12 flex items-center gap-1.5 flex-wrap justify-center lg:justify-start"
              >
                <span>Dikelola oleh</span>
                <span className="font-semibold text-[var(--color-text-muted)]">Subbagian Layanan Akademik IAIN Bone</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>untuk para wisudawan IAIN Bone</span>
                </span>
              </motion.p>
            </div>
          </div>

          {/* 2. Right Column: Event Info & Data (Mobile: Tengah, Desktop: Kanan) */}
          <div className="order-2 lg:order-none flex flex-col gap-3 sm:gap-4 w-full">

            {/* Right Column Content - Switchable */}
            <div className="relative w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePeriodIdx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3 sm:gap-4 w-full"
                >
                  {(() => {
                    const period = graduationPeriods[activePeriodIdx];
                    return (
                      <>
                        {/* 1. Event Card */}
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-xl rounded-2xl p-6 relative z-[60]">
                          <div className="mb-6">
                            {(() => {
                              const showCalendarBtn = activePeriodIdx === 0 && period.date && parseToCalendarDate(period.date);
                              return (
                                <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-4">
                                  <div className={`flex items-center gap-3 ${!showCalendarBtn ? 'w-full' : ''}`}>
                                    <span className={`inline-flex items-center self-start sm:self-auto px-4 py-1.5 rounded-full text-white text-xs font-medium tracking-wider uppercase shrink-0 ${period.statusColor === 'emerald' ? 'bg-emerald-800' : period.statusColor === 'rose' ? 'bg-rose-800' : 'bg-slate-700'}`}>
                                      {period.status}
                                    </span>

                                    {/* Navigation Controls */}
                                    {graduationPeriods.length > 1 && (
                                      <div className={`hidden sm:flex items-center gap-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full p-1 ${!showCalendarBtn ? 'ml-auto' : ''}`}>
                                    <button
                                      onClick={() => setActivePeriodIdx(Math.max(0, activePeriodIdx - 1))}
                                      disabled={activePeriodIdx === 0}
                                      className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${activePeriodIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400 cursor-pointer'}`}
                                    >
                                      <ChevronLeft size={14} />
                                    </button>
                                    <span className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase tracking-widest whitespace-nowrap px-2">
                                      Periode {activePeriodIdx + 1} dari {graduationPeriods.length}
                                    </span>
                                    <button
                                      onClick={() => setActivePeriodIdx(Math.min(graduationPeriods.length - 1, activePeriodIdx + 1))}
                                      disabled={activePeriodIdx === graduationPeriods.length - 1}
                                      className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${activePeriodIdx === graduationPeriods.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400 cursor-pointer'}`}
                                    >
                                      <ChevronRight size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Calendar Button (hanya di kartu pertama untuk sekarang) */}
                              {/* Calendar Button (hanya di kartu pertama untuk sekarang) */}
                              {activePeriodIdx === 0 && period.date && parseToCalendarDate(period.date) && (
                                <div className="relative" ref={calendarRef}>
                                  <button
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all text-xs sm:text-xs font-medium focus:outline-none shrink-0"
                                  >
                                    <CalendarPlus size={15} />
                                    <span>Ingatkan</span>
                                    <ChevronDown size={13} className={`transition-transform duration-200 ${showCalendar ? "rotate-180" : ""}`} />
                                  </button>

                                  <AnimatePresence>
                                    {showCalendar && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                        transition={{ duration: 0.18 }}
                                        className="absolute right-0 top-full mt-2 w-[200px] sm:w-48 bg-[var(--color-surface)] backdrop-blur-xl rounded-xl border border-[var(--color-border)] p-1.5 text-sm text-left flex flex-col z-30"
                                      >
                                        {(() => {
                                          const eventDate = parseToCalendarDate(period.date);
                                          if (!eventDate) return null;
                                          const loc = encodeURIComponent([period.venue, period.location].filter(Boolean).join(', '));
                                          
                                          if (!period.session1 && !period.session2) {
                                            return (
                                              <>
                                                <div className="px-3 py-1.5 text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">
                                                  Wisuda IAIN Bone
                                                </div>
                                                <a
                                                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${eventDate}T000000Z%2F${eventDate}T090000Z&details=Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone.&location=${loc}&text=Wisuda%20IAIN%20Bone`}
                                                  target="_blank" rel="noopener noreferrer"
                                                  className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                >
                                                  Google Calendar
                                                </a>
                                                <a
                                                  href={`https://outlook.live.com/calendar/0/deeplink/compose?allday=false&body=Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone.&enddt=${eventDate.slice(0,4)}-${eventDate.slice(4,6)}-${eventDate.slice(6,8)}T09%3A00%3A00Z&location=${loc}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${eventDate.slice(0,4)}-${eventDate.slice(4,6)}-${eventDate.slice(6,8)}T00%3A00%3A00Z&subject=Wisuda%20IAIN%20Bone`}
                                                  target="_blank" rel="noopener noreferrer"
                                                  className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                >
                                                  Outlook Calendar
                                                </a>
                                                <a
                                                  href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${eventDate}T000000Z%0ADTEND:${eventDate}T090000Z%0ASUMMARY:Wisuda%20IAIN%20Bone%0ADESCRIPTION:Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone.%0ALOCATION:${loc}%0AEND:VEVENT%0AEND:VCALENDAR`}
                                                  download="wisuda.ics"
                                                  className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                >
                                                  Apple Calendar (iCal)
                                                </a>
                                              </>
                                            );
                                          }

                                          return (
                                            <>
                                              {period.session1 && (
                                                <>
                                                  <div className="px-3 py-1.5 text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">
                                                    Sesi Pertama ({period.session1})
                                                  </div>
                                                  <a
                                                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${eventDate}T000000Z%2F${eventDate}T040000Z&details=Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone%20-%20Sesi%20Pertama.&location=${loc}&text=Wisuda%20IAIN%20Bone%20(Sesi%201)`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                  >
                                                    Google Calendar
                                                  </a>
                                                  <a
                                                    href={`https://outlook.live.com/calendar/0/deeplink/compose?allday=false&body=Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone%20-%20Sesi%20Pertama.&enddt=${eventDate.slice(0,4)}-${eventDate.slice(4,6)}-${eventDate.slice(6,8)}T04%3A00%3A00Z&location=${loc}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${eventDate.slice(0,4)}-${eventDate.slice(4,6)}-${eventDate.slice(6,8)}T00%3A00%3A00Z&subject=Wisuda%20IAIN%20Bone%20%28Sesi%201%29`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                  >
                                                    Outlook Calendar
                                                  </a>
                                                  <a
                                                    href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${eventDate}T000000Z%0ADTEND:${eventDate}T040000Z%0ASUMMARY:Wisuda%20IAIN%20Bone%20(Sesi%201)%0ADESCRIPTION:Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone%20-%20Sesi%20Pertama.%0ALOCATION:${loc}%0AEND:VEVENT%0AEND:VCALENDAR`}
                                                    download="wisuda-sesi1.ics"
                                                    className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                  >
                                                    Apple Calendar (iCal)
                                                  </a>
                                                </>
                                              )}
                                              {period.session1 && period.session2 && (
                                                <div className="h-px bg-[var(--color-border)] my-1.5"></div>
                                              )}
                                              {period.session2 && (
                                                <>
                                                  <div className="px-3 py-1.5 text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">
                                                    Sesi Kedua ({period.session2})
                                                  </div>
                                                  <a
                                                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${eventDate}T050000Z%2F${eventDate}T090000Z&details=Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone%20-%20Sesi%20Kedua.&location=${loc}&text=Wisuda%20IAIN%20Bone%20(Sesi%202)`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                  >
                                                    Google Calendar
                                                  </a>
                                                  <a
                                                    href={`https://outlook.live.com/calendar/0/deeplink/compose?allday=false&body=Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone%20-%20Sesi%20Kedua.&enddt=${eventDate.slice(0,4)}-${eventDate.slice(4,6)}-${eventDate.slice(6,8)}T09%3A00%3A00Z&location=${loc}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${eventDate.slice(0,4)}-${eventDate.slice(4,6)}-${eventDate.slice(6,8)}T05%3A00%3A00Z&subject=Wisuda%20IAIN%20Bone%20%28Sesi%202%29`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                  >
                                                    Outlook Calendar
                                                  </a>
                                                  <a
                                                    href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${eventDate}T050000Z%0ADTEND:${eventDate}T090000Z%0ASUMMARY:Wisuda%20IAIN%20Bone%20(Sesi%202)%0ADESCRIPTION:Acara%20Upacara%20Wisuda%20ke-XVII%20Institut%20Agama%20Islam%20Negeri%20Bone%20-%20Sesi%20Kedua.%0ALOCATION:${loc}%0AEND:VEVENT%0AEND:VCALENDAR`}
                                                    download="wisuda-sesi2.ics"
                                                    className="block px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors font-medium text-xs"
                                                  >
                                                    Apple Calendar (iCal)
                                                  </a>
                                                </>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}
                            </div>
                            );
                            })()}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                              <p className="text-sm sm:text-base font-semibold uppercase tracking-wide text-[var(--color-text)] leading-relaxed">
                                {period.title}
                              </p>
                              {period.linkPengumuman && (
                                <button
                                  onClick={() => setSelectedPdf(period.linkPengumuman || null)}
                                  className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/30 text-xs sm:text-xs font-medium rounded-xl transition-all shrink-0"
                                >
                                  <FileText size={15} />
                                  Pengumuman
                                </button>
                              )}
                            </div>
                          </div>

                          <div className={`grid grid-cols-1 gap-3 mt-2 ${(period.location || period.venue || period.session1 || period.session2) ? 'sm:grid-cols-2' : ''}`}>
                            {/* Tanggal */}
                            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-emerald-500/30 transition-colors">
                              <div className="w-10 h-10 rounded-xl bg-emerald-800/10 border border-emerald-800/20 flex items-center justify-center shrink-0">
                                <Calendar size={18} className="text-emerald-800 dark:text-emerald-400" />
                              </div>
                              <div>
                                <p className="text-[var(--color-text)] font-semibold text-sm">
                                  {period.day}{period.day && period.date ? ', ' : ''}{period.date}
                                </p>
                              </div>
                            </div>

                            {/* Tempat */}
                            {(period.location || period.venue) && (
                              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-emerald-500/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-emerald-800/10 border border-emerald-800/20 flex items-center justify-center shrink-0">
                                  <MapPin size={18} className="text-emerald-800 dark:text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-[var(--color-text)] font-semibold text-sm">
                                    {[period.venue, period.location].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Sesi 1 (Minimalis) */}
                            {period.session1 && (
                              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-emerald-500/30 transition-colors">
                                <Clock size={16} className="text-[var(--color-text-muted)] shrink-0" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full sm:gap-2">
                                  <p className="text-[var(--color-text)] font-semibold text-sm">Sesi 1</p>
                                  <p className="text-[var(--color-text-muted)] text-xs sm:text-sm mt-0.5 sm:mt-0">{period.session1}</p>
                                </div>
                              </div>
                            )}

                            {/* Sesi 2 (Minimalis) */}
                            {period.session2 && (
                              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-amber-500/30 transition-colors">
                                <Clock size={16} className="text-[var(--color-text-muted)] shrink-0" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full sm:gap-2">
                                  <p className="text-[var(--color-text)] font-semibold text-sm">Sesi 2</p>
                                  <p className="text-[var(--color-text-muted)] text-xs sm:text-sm mt-0.5 sm:mt-0">{period.session2}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {period.hint_pendaftaran && (
                            <div className="mt-4 p-3 rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs sm:text-sm font-medium">
                              {period.hint_pendaftaran}
                            </div>
                          )}
                        </div>

                        {/* 2. Stats Row */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                          {period.stats.map((stat, idx) => {
                            const StatIcon = iconMap[stat.icon] || Users;
                            return (
                              <div 
                                key={idx} 
                                className={`group relative z-10 hover:z-50 focus:z-50 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-md rounded-2xl p-3 sm:p-4 flex flex-col items-center sm:flex-row sm:justify-start sm:gap-3 transition-all ${stat.details ? 'cursor-pointer hover:border-emerald-500/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none outline-none' : ''}`}
                                tabIndex={stat.details ? 0 : undefined}
                              >
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 mb-2 sm:mb-0`}>
                                  <StatIcon size={16} className="sm:hidden" />
                                  <StatIcon size={18} className="hidden sm:block" />
                                </div>
                                <div className="text-center sm:text-left flex flex-col justify-center">
                                  <p className="text-xs text-[var(--color-text-muted)] font-normal uppercase tracking-wider mb-0.5">
                                    <span className="sm:hidden">
                                      {stat.label === "Kuota Total" ? "Kuota" : stat.label === "Sisa Kuota" ? "Tersisa" : stat.label}
                                    </span>
                                    <span className="hidden sm:inline">
                                      {stat.label}
                                    </span>
                                  </p>
                                  <p className="text-base sm:text-lg font-bold text-[var(--color-text)] font-mono tracking-wider leading-none">{stat.value}</p>
                                </div>

                                {stat.details && stat.details.length > 0 && (
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200">
                                    <div className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase tracking-wider px-2 pt-1 pb-2 text-center border-b border-[var(--color-border)] mb-1">
                                      Detail per Fakultas
                                    </div>
                                    {stat.details.map((detail, dIdx) => (
                                      <div key={dIdx} className="flex justify-between items-center px-2 py-1.5 text-xs hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors">
                                        <span className="font-semibold text-[var(--color-text)]">{detail.label}</span>
                                        <span className="text-[var(--color-text-muted)]">{detail.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* 3. Countdown & CTA */}
                        <div className="relative overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-xl rounded-2xl p-6 sm:py-8">
                          {/* Background Glow */}
                          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>

                          <div className="flex flex-col gap-6 relative z-10 w-full">
                            {/* Header Card: Badge & Date */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-white text-xs font-medium tracking-wider uppercase shrink-0 ${period.statusColor === 'emerald' ? 'bg-emerald-800' : period.statusColor === 'rose' ? 'bg-rose-800' : 'bg-slate-700'}`}>
                                Jadwal Pendaftaran
                              </span>
                              <p className="text-xs sm:text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider">
                                {period.registrationDateLabel}
                              </p>
                            </div>

                            {/* Konten Utama: Countdown & Button */}
                            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 w-full">
                              {/* Countdown */}
                              {isClient && (
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 md:gap-2">
                                  {Object.entries(timeLeft).map(([unit, value], idx, arr) => (
                                    <div key={unit} className="flex items-center gap-1.5 md:gap-2">
                                      <div className="flex flex-col items-center justify-center shrink-0 min-w-[40px] md:min-w-[36px]">
                                        <span className="text-3xl md:text-2xl font-bold text-[var(--color-text)] font-mono tracking-wider">
                                          {value.toString().padStart(2, "0")}
                                        </span>
                                        <span className="text-xs md:text-[9px] text-[var(--color-text-muted)] uppercase tracking-widest font-bold mt-0.5">
                                          {unit}
                                        </span>
                                      </div>
                                      {idx !== arr.length - 1 && (
                                        <div className="text-2xl md:text-xl font-light text-[var(--color-border)] pb-3 md:pb-2.5">:</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Kanan: CTA Button */}
                              <div className="hidden md:flex flex-col items-center md:items-end shrink-0 mt-2 md:mt-0">
                                {period.statusColor === 'rose' ? (
                                  <button
                                    disabled
                                    className="group relative flex items-center justify-center gap-3 px-10 py-3.5 rounded-xl text-white text-sm font-bold transition-all duration-300 w-full md:w-auto md:min-w-[200px] overflow-hidden bg-slate-700 opacity-50 cursor-not-allowed"
                                  >
                                    <span className="relative z-10 flex items-center gap-3">
                                      Daftar Sekarang
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </span>
                                  </button>
                                ) : (
                                  <a
                                    href="/auth"
                                    className={`group relative flex items-center justify-center gap-3 px-10 py-3.5 rounded-xl text-white text-sm font-bold transition-all duration-300 w-full md:w-auto md:min-w-[200px] overflow-hidden ${period.statusColor === 'emerald' ? 'bg-emerald-800 hover:bg-emerald-900-emerald-900/20' : 'bg-slate-700 hover:bg-slate-800-slate-900/20'}`}
                                  >
                                    <span className="relative z-10 flex items-center gap-3">
                                      Daftar Sekarang
                                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </span>
                                    {period.statusColor === 'emerald' && <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Navigation Controls (Below Card) */}
                        {graduationPeriods.length > 1 && (
                          <div className="flex sm:hidden items-center justify-center gap-1 mt-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full p-1.5 w-max mx-auto">
                            <button
                              onClick={() => setActivePeriodIdx(Math.max(0, activePeriodIdx - 1))}
                              disabled={activePeriodIdx === 0}
                              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${activePeriodIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 cursor-pointer'}`}
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-widest whitespace-nowrap px-4">
                              Periode {activePeriodIdx + 1} dari {graduationPeriods.length}
                            </span>
                            <button
                              onClick={() => setActivePeriodIdx(Math.min(graduationPeriods.length - 1, activePeriodIdx + 1))}
                              disabled={activePeriodIdx === graduationPeriods.length - 1}
                              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${activePeriodIdx === graduationPeriods.length - 1 ? 'opacity-30 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 cursor-pointer'}`}
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>


            </div>

          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfModal
        isOpen={!!selectedPdf}
        onClose={() => setSelectedPdf(null)}
        pdfUrl={selectedPdf || ''}
      />

      {/* Mobile Floating CTA Bar */}
      <AnimatePresence>
        {showFloatingBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-4 right-4 z-[60] flex md:hidden"
          >
            <a
              href="/auth"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold transition-all-[0_8px_30px_rgba(0,0,0,0.2)]"
            >
              <GraduationCap size={18} />
              <span>Login Sekarang</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
