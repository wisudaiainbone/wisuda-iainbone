"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { updateWisudawan, saveFotoWisudawan, daftarWisuda } from "@/actions/wisudawan";
import { getPerbaikanByNim, createPerbaikan, type Perbaikan } from "@/actions/perbaikan";
import {
  GraduationCap, BookOpen, Calendar, Clock, Users, Award,
  QrCode, ArrowLeft, Star, BadgeCheck, FileText, Hash,
  Timer, Mail, CheckCircle2, MapPin, Megaphone,
  MessageCircle, BookMarked, ChevronDown, ChevronUp, Pencil, LogOut, Camera, Eye, Loader2, Lock, Key,
  FileEdit, Plus, X, Send, ClipboardList, Maximize
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CropModal from "@/components/ui/CropModal";
import { getCroppedImg } from "@/lib/cropImage";
import { useToast } from "@/components/ui/Toast";
import DownloadSertifikatButton from "@/components/wisudawan/DownloadSertifikatButton";

import { uploadFotoToGDrive, getOptimizedGDriveUrl } from "@/lib/uploadFoto";

/* ── Types ─────────────────────────────────── */
type W = {
  "NIM": string; "NAMA MAHASISWA": string; "IPK": string; "PREDIKAT": string;
  "FAKULTAS": string; "PRODI": string; "TOGA": string; "TANGGAL YUDISIUM": string;
  "PERIODE": string; "STATUS": string; "SESI": string; "EMAIL": string;
  "ID WISUDA": string; "TTL": string; "JUDUL SKRIPSI / TESIS": string;
  "JENIS KELAMIN": string; "ORMAWA": string; "JABATAN DALAM ORMAWA": string;
  "FOTO": string; "SERTIFIKAT": string; "NAMA GELAR": string; "PRODI SINGKAT": string;
  "QR TOGA": string; "ID UNDANGAN": string; "QR UNDANGAN": string; "URUT": number;
  "WAKTU TOGA": string; "WAKTU HADIR": string; "PRESTASI AKD": string;
  "PRESTASI ORG": string; "TERDAFTAR": boolean; "SURVEI": boolean;
  "TIMESTAMP": string; "LOG STATUS": any[];
  // Field bantu untuk split TTL (tidak disimpan ke DB, hanya state lokal)
  "TEMPAT_LAHIR"?: string;
  "TANGGAL_LAHIR"?: string;
};
type Period = {
  id: any; title: string; status: string; date: string; day: string; location: string; venue: string;
  session1: string; session2: string; statusColor: string; stats: any[]; registrationDateLabel: string;
  pengumuman?: string; gladi?: string; wagLink?: string;
  [key: string]: any;
};

const ormawaOptions = [
  "SEMA IAIN Bone", "DEMA IAIN Bone", "Mapala Mappesompae", "Sanggar Seni Budaya", "KSR-PMI UNIT 02", "Koperasi Mahasiswa", "DRP Lapatau Matanna Tikka Gudep. 22.045", "DRP Bataritoja Gudep. 22.046", "Forum Ukhuwah Islamiyah Mahasiswi", "Forum Kajian Ilmiah", "Lembaga Kajian Qur'ani", "Resimen Mahasiswa", "Forum Komunikasi Mahasiswa Pascasarjana", "Lembaga Pers Mahasiswa", "SEMA Fakultas Tabiyah", "SEMA Fakultas Syariah dan Hukum Islam", "SEMA Fakultas Ushuluddin dan Dakwah", "SEMA Fakultas Ekonomi dan Bisnis Islam", "DEMA Fakultas Tabiyah", "DEMA Fakultas Syariah dan Hukum Islam", "DEMA Fakultas Ushuluddin dan Dakwah", "DEMA Fakultas Ekonomi dan Bisnis Islam", "HMPS MPI", "HMPS TBI", "HMPS PIAUD", "HMPS PAI", "HMPS PBA", "HMPS PGMI", "HMPS HTN", "HMPS HKI", "HMPS HES", "HMPS EKSYAR", "HMPS Perbankan Syariah", "HMPS AKUNSYAH", "HMPS IAT", "HMPS KPI", "HMPS BPI", "FORSA"
];

const jabatanOptions = [
  "Ketua", "Ketua 2", "Sekretaris", "Sekretaris 2", "Wakil Ketua", "Bendahara", "Wakil Bendahara", "Wakil Bendahara Umum", "Wakil Sekretaris", "Wakil Sekretaris Umum", "Anggota"
];

/* ── Helpers ───────────────────────────────── */
const ini = (n: string) => n.split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase();
const fDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
const fDT = (s: string) => new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

/* ── Accent themes ─────────────────────────── */
const THEMES = [
  { av: "from-emerald-500 to-teal-600", line: "bg-emerald-500" },
  { av: "from-violet-500 to-emerald-600", line: "bg-violet-500" },
  { av: "from-rose-500 to-pink-600", line: "bg-rose-500" },
  { av: "from-amber-500 to-orange-500", line: "bg-amber-500" },
];

/* ── Sub-components ────────────────────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-xl rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ icon, title, isCompleted }: { icon: React.ReactNode; title: string; isCompleted?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] rounded-t-2xl">
      <span className={isCompleted ? "text-emerald-500" : "text-[var(--color-text-subtle)]"}>
        {isCompleted ? <CheckCircle2 size={15} className="fill-emerald-100 dark:fill-emerald-900/30" /> : icon}
      </span>
      <span className={`text-xs font-bold tracking-[0.1em] uppercase ${isCompleted ? "text-[var(--color-text)]" : "text-[var(--color-text-subtle)]"}`}>
        {title}
      </span>
    </div>
  );
}

function InputRow({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[120px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-xs text-[var(--color-text-subtle)] font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[160px_1fr] gap-1 sm:gap-2 sm:items-baseline py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-xs text-[var(--color-text-subtle)] font-medium whitespace-nowrap">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-text)] leading-snug text-left sm:text-right">{value}</span>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-center">
      <span className="text-2xl font-extrabold font-mono text-[var(--color-text)]">{value}</span>
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)] mt-0.5">{label}</span>
      {sub && <span className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</span>}
    </div>
  );
}

/* ── Page ──────────────────────────────────── */
export default function ClientProfile({ nim, w: initialW, activePeriode, allowEditToga = true, allowEditProfile = true, showTogaInfo = true, showUndanganInfo = true, allowPerbaikan = true, showPrestasiCard = false, contohFotoUrl }: { nim: string, w: W, activePeriode: any, allowEditToga?: boolean, allowEditProfile?: boolean, showTogaInfo?: boolean, showUndanganInfo?: boolean, allowPerbaikan?: boolean, showPrestasiCard?: boolean, contohFotoUrl?: string }) {
  const [w, setW] = useState<W>(initialW);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Jika activePeriode ada, sesuaikan formatnya
  const p: Period = activePeriode ? {
    ...activePeriode,
    title: activePeriode.nama_periode,
    date: activePeriode.tanggal_pelaksanaan?.split(', ')[1] || '',
    day: activePeriode.tanggal_pelaksanaan?.split(', ')[0] || '',
    location: activePeriode.tempat_pelaksanaan?.split(', ')[1] || '',
    venue: activePeriode.tempat_pelaksanaan?.split(', ')[0] || '',
    session1: activePeriode.waktu_sesi_1,
    session2: activePeriode.waktu_sesi_2,
    registrationDateLabel: activePeriode.tanggal_pendaftaran,
    gladi: activePeriode.jadwal_gladi,
    wagLink: activePeriode.wagLink || activePeriode.waglink,
    linkPengumuman: activePeriode.linkPengumuman || activePeriode.link_pengumuman,
    themeImage: activePeriode.themeImage || activePeriode.theme,
    statusColor: activePeriode.statusColor || activePeriode.status_color
  } : {} as Period;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUndanganOpen, setIsUndanganOpen] = useState(false);
  const [isTogaOpen, setIsTogaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialW["STATUS"] === "Calon Wisudawan" ? "lengkapi_data" : "pelaksanaan");
  const [isHintOpen, setIsHintOpen] = useState(true);

  const handleLogout = () => {
    window.location.href = '/';
  };

  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKetentuanFotoOpen, setIsKetentuanFotoOpen] = useState(true);
  const [isContohFotoZoomed, setIsContohFotoZoomed] = useState(false);
  const [isJabatanLainnya, setIsJabatanLainnya] = useState(false);
  const [isDaftarDialogOpen, setIsDaftarDialogOpen] = useState(false);
  const [isDaftarLoading, setIsDaftarLoading] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ Hari: 0, Jam: 0, Menit: 0, Detik: 0 });

  // Ubah Password State
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Perbaikan State
  const [perbaikanList, setPerbaikanList] = useState<Perbaikan[]>([]);
  const [isPerbaikanLoading, setIsPerbaikanLoading] = useState(false);
  const [isPerbaikanModalOpen, setIsPerbaikanModalOpen] = useState(false);
  const [perbaikanDetail, setPerbaikanDetail] = useState("");
  const [isSubmittingPerbaikan, setIsSubmittingPerbaikan] = useState(false);
  const [perbaikanLoaded, setPerbaikanLoaded] = useState(false);

  useEffect(() => {
    let targetDate = 0;

    if (p.registrationDateLabel) {
      const MONTHS: Record<string, number> = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
        'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
        'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
      };
      const str = p.registrationDateLabel.toLowerCase();
      const allMatches = [...str.matchAll(/(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?/g)];
      const yearMatch = str.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      if (allMatches.length > 0) {
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

    if (!targetDate || targetDate <= 0) return;

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
  }, [p.registrationDateLabel]);


  // Load data perbaikan saat tab aktif
  useEffect(() => {
    if (activeTab === "perbaikan" && !perbaikanLoaded) {
      setIsPerbaikanLoading(true);
      getPerbaikanByNim(nim).then((list) => {
        setPerbaikanList(list);
        setIsPerbaikanLoading(false);
        setPerbaikanLoaded(true);
      });
    }
  }, [activeTab, nim, perbaikanLoaded]);

  const handleSubmitPerbaikan = async () => {
    if (!perbaikanDetail.trim()) {
      showToast("Mohon isi detail perbaikan yang diinginkan.", "error");
      return;
    }
    setIsSubmittingPerbaikan(true);
    const res = await createPerbaikan(nim, perbaikanDetail);
    setIsSubmittingPerbaikan(false);
    if (res.success && res.data) {
      setPerbaikanList((prev) => [res.data!, ...prev]);
      setIsPerbaikanModalOpen(false);
      setPerbaikanDetail("");
      showToast("✓ Pengajuan perbaikan berhasil dikirim!", "success");
    } else {
      showToast(res.error || "Gagal mengirim pengajuan.", "error");
    }
  };

  const idx = parseInt(nim.substring(nim.length - 2)) || 0;
  const [formData, setFormData] = useState<Partial<W>>({});

  useEffect(() => {
    if (w) {
      setFormData(w);
      if (w["JABATAN DALAM ORMAWA"] && !jabatanOptions.includes(w["JABATAN DALAM ORMAWA"])) setIsJabatanLainnya(true);
    }
  }, [w]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const tempatLahir = formData["TEMPAT_LAHIR"] || (formData["TTL"] ? formData["TTL"].split(',')[0]?.trim() : "");
    const tanggalLahir = formData["TANGGAL_LAHIR"] || (formData["TTL"] ? formData["TTL"].split(',')[1]?.trim() : "");

    const judul = typeof formData["JUDUL SKRIPSI / TESIS"] === "string" ? formData["JUDUL SKRIPSI / TESIS"].trim() : "";
    if (!formData["TOGA"] || !formData["EMAIL"] || !tempatLahir || !tanggalLahir || !formData["JENIS KELAMIN"] || !judul || judul === "-" || judul.split(/\s+/).length < 5) {
      showToast("Gagal menyimpan! Mohon lengkapi semua field wajib dan pastikan judul skripsi minimal 5 kata.", "error");
      return;
    }

    if (formData["ORMAWA"] && !formData["JABATAN DALAM ORMAWA"]) {
      showToast("Gagal menyimpan! Jabatan dalam Ormawa wajib diisi jika Ormawa dipilih.", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData["EMAIL"])) {
      showToast("Gagal menyimpan! Format email tidak valid.", "error");
      return;
    }

    formData["TTL"] = `${tempatLahir}, ${tanggalLahir}`;

    setIsSubmitting(true);
    try {
      const res = await updateWisudawan(nim, formData);
      if (res && res.success === false) {
        throw new Error(res.error || "Gagal menyimpan perubahan.");
      }
      setW((prev) => ({ ...prev, ...formData }));
      setIsEditing(false);
      showToast("✓ Perubahan berhasil disimpan!", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Gagal menyimpan perubahan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("Password dan Konfirmasi Password tidak cocok!", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password minimal 6 karakter!", "error");
      return;
    }

    setIsChangingPassword(true);
    const { changePasswordWisudawan } = await import('@/actions/wisudawan');
    const res = await changePasswordWisudawan(nim, newPassword);
    setIsChangingPassword(false);

    if (res.success) {
      showToast("✓ Password berhasil diubah!", "success");
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } else {
      showToast(res.error || "Gagal mengubah password.", "error");
    }
  };
  const th = THEMES[idx % THEMES.length];
  const letters = ini(w["NAMA MAHASISWA"]);

  const up = (d = 0) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: d },
  });

  const hasPengumuman = p.pengumuman && p.pengumuman.replace(/<[^>]*>?/gm, '').trim() !== "";

  const warningHint = hasPengumuman ? (
    <motion.div {...up(0.05)} className="mb-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl backdrop-blur-xl relative overflow-hidden">
      <button
        onClick={() => setIsHintOpen(!isHintOpen)}
        className="w-full flex items-center justify-between p-4"
      >
        <span className="font-extrabold uppercase tracking-wider text-xs text-amber-700 dark:text-amber-400">Informasi Penting</span>
        <div className={`transition-transform duration-300 ${isHintOpen ? "rotate-180" : ""}`}>
          <ChevronDown size={14} className="text-amber-700 dark:text-amber-400" />
        </div>
      </button>

      <AnimatePresence>
        {isHintOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="flex flex-col text-sm text-amber-800 dark:text-amber-300 w-full leading-relaxed border-t border-amber-200/50 dark:border-amber-500/20 pt-3">
                <p className="font-medium text-justify whitespace-pre-wrap">
                  {p.pengumuman}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  ) : null;

  const jadwalWisudaCard = (
    <div className="flex flex-col gap-4">
      <motion.div {...up(0.1)}>
        <Card>
          <CardTitle icon={<Calendar size={13} />} title="Jadwal Wisuda" />
          <div className="px-4 py-2 flex flex-col">
            <div className="py-3 border-b border-[var(--color-border)]">
              <h4 className="text-sm font-extrabold text-[var(--color-text)] leading-snug uppercase tracking-wide">Wisuda Program Sarjana dan Magister {w["PERIODE"] || p.title} IAIN Bone</h4>
            </div>
            {[
              { label: "Periode", value: w["PERIODE"] || p.title || "-" },
              { label: "Pelaksanaan", value: `${p.day}, ${p.date}` },
              { label: "Tempat", value: `${p.venue}, ${p.location}` },
              ...(w["STATUS"] !== "Calon Wisudawan" && w["SESI"] && w["SESI"] !== "-" && w["SESI"] !== "Belum Ditentukan" ? [
                { label: "Sesi", value: w["SESI"] },
                { label: "Nomor Urut", value: w["URUT"] ? `${w["URUT"]}` : "-" },
                { label: "Jam Sesi", value: w["SESI"] === "Sesi 1" || w["SESI"] === "SESI 1" ? p.session1 : p.session2 },
              ] : []),
            ].map(s => (
              <div key={s.label} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
                <div className="flex items-center justify-between shrink-0 sm:mt-0.5 w-full sm:w-[115px]">
                  <p className="text-xs text-[var(--color-text-subtle)] font-semibold uppercase tracking-wider">{s.label}</p>
                  <span className="text-xs text-[var(--color-text-subtle)] font-bold hidden sm:block">:</span>
                </div>
                <p className="text-xs font-bold text-[var(--color-text)] text-left leading-snug flex-1">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5">
            {p.hint_pendaftaran && (
              <div className="px-3 py-2.5 my-0.5 rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-medium whitespace-pre-wrap leading-relaxed text-center">
                {p.hint_pendaftaran}
              </div>
            )}
            {w["STATUS"] !== "Calon Wisudawan" && showUndanganInfo && (
              <button
                onClick={() => setIsUndanganOpen(true)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-bold transition-all w-full"
              >
                <QrCode size={15} />
                Lihat Undangan Wisuda
              </button>
            )}
            {p.linkPengumuman && (
              <a href={p.linkPengumuman} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-all w-full">
                <Megaphone size={15} />
                Link Pengumuman Resmi
              </a>
            )}
            {w["STATUS"] !== "Calon Wisudawan" && p.wagLink && (
              <a href={p.wagLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold transition-all w-full">
                <MessageCircle size={15} />
                Gabung WhatsApp Group
              </a>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );

  const judulSkripsi = typeof w["JUDUL SKRIPSI / TESIS"] === "string" ? w["JUDUL SKRIPSI / TESIS"].trim() : "";
  const isFormLengkap = !!(
    w["EMAIL"]?.trim() &&
    w["TTL"]?.trim() &&
    w["JENIS KELAMIN"]?.trim() &&
    w["TOGA"]?.trim() &&
    judulSkripsi && judulSkripsi !== "-" && judulSkripsi.split(/\s+/).length >= 5
  );

  const isAllRequiredFilled = !!(
    isFormLengkap &&
    w["FOTO"]
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative">
      {/* Background Grid & Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 text-slate-900 dark:text-white opacity-[0.04] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-emerald-800/10 blur-3xl" />
        <div className="absolute bottom-20 right-[8%] w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[80px]" />
      </div>

      {/* ════ NAVBAR (MOBILE) ════════════════════════════ */}
      <nav className="lg:hidden sticky top-0 z-50 h-14 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-xl flex items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
          <span className="text-sm font-semibold tracking-tight transition-colors duration-300 font-[var(--font-outfit)] text-[var(--color-text)]">Wisuda IAIN Bone</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPasswordDialogOpen(true)} className="flex items-center justify-center h-9 w-9 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full" title="Ubah Password">
            <Key size={15} />
          </button>
          {w["STATUS"] !== "Calon Wisudawan" && allowEditProfile && (
            <button onClick={() => setIsEditing(!isEditing)} className="hidden md:flex items-center justify-center h-9 w-9 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full" title={isEditing ? "Batal Edit" : "Edit Data"}>
              <Pencil size={15} />
            </button>
          )}
          <Link href="/auth" className="flex items-center justify-center h-9 w-9 text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full" title="Logout">
            <LogOut size={15} />
          </Link>
          <div className="flex items-center justify-center h-9 w-9 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full overflow-hidden [&>button]:border-none [&>button]:bg-transparent [&>button]:w-full [&>button]:h-full [&>button]:rounded-none">
            <ThemeToggle isScrolled={true} />
          </div>
        </div>
      </nav>

      {/* ════ NAVBAR (DESKTOP) ════════════════════════════ */}
      <nav className="hidden lg:flex sticky top-0 z-50 h-16 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
          <span className="text-base font-semibold tracking-tight transition-colors duration-300 font-[var(--font-outfit)] text-[var(--color-text)]">Wisuda IAIN Bone</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setIsPasswordDialogOpen(true)} className="flex items-center h-9 gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/40">
            <Key size={14} /> Password
          </button>
          <Link href="/auth" className="flex items-center h-9 gap-1.5 text-xs font-medium text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40">
            <LogOut size={14} /> Logout
          </Link>
          {w["STATUS"] !== "Calon Wisudawan" && allowEditProfile && (
            <button onClick={() => setIsEditing(!isEditing)} className="flex items-center h-9 gap-1.5 text-xs font-medium text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-bg-secondary)]">
              <Pencil size={14} /> {isEditing ? "Batal Edit" : "Edit Data"}
            </button>
          )}
          <div className="flex items-center justify-center h-9 w-9 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full overflow-hidden [&>button]:border-none [&>button]:bg-transparent [&>button]:w-full [&>button]:h-full [&>button]:rounded-none">
            <ThemeToggle isScrolled={true} />
          </div>
        </div>
      </nav>

      {/* ════ HERO ══════════════════════════════ */}
      {/* Main content */}
      <div className="relative">
        {/* profile card */}
        <div className="relative z-10 max-w-none px-4 sm:px-8 pt-6 sm:pt-8">
          <motion.div {...up(0)} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] backdrop-blur-xl rounded-2xl relative overflow-hidden">

            {/* Theme Image Background */}
            {p.themeImage && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <Image src={p.themeImage} alt="Theme Background" fill className="object-cover opacity-25 dark:opacity-20 mix-blend-overlay sm:mix-blend-normal" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-secondary)] via-[var(--color-bg-secondary)]/80 to-transparent sm:bg-gradient-to-r sm:from-[var(--color-bg-secondary)] sm:via-[var(--color-bg-secondary)]/80 sm:to-transparent" />
              </div>
            )}

            <div className="p-5 sm:p-6 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">

                {/* Avatar */}
                <div
                  className={`relative w-44 sm:w-36 shrink-0 rounded-xl overflow-hidden ring-4 ring-[var(--color-bg-secondary)] bg-[var(--color-surface)] flex items-center justify-center ${w["FOTO"] ? "cursor-pointer" : ""}`}
                  style={{ aspectRatio: '3/4' }}
                  onClick={() => w["FOTO"] && setIsPreviewOpen(true)}
                >
                  {uploadStatus === 'uploading' && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 gap-2">
                      <Loader2 size={28} className="text-white animate-spin" />
                      <span className="text-white text-xs font-bold">Mengunggah...</span>
                    </div>
                  )}
                  {w["FOTO"] ? (
                    <Image src={getOptimizedGDriveUrl(w["FOTO"] as string)} alt={w["NAMA MAHASISWA"] || "Foto Profil"} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <span className="text-4xl font-extrabold">{letters}</span>
                    </div>
                  )}
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start">
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mb-1.5">
                    {(w["PERIODE"] || p.title) && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-600 text-white">
                        {w["PERIODE"] || p.title}
                      </span>
                    )}
                    {w["TERDAFTAR"] && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white bg-emerald-600">
                        ✓ Terdaftar
                      </span>
                    )}
                    {w["STATUS"] && w["STATUS"] !== "Terdaftar" && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${w["STATUS"] === "Calon Wisudawan"
                        ? "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                        : w["STATUS"] === "Selesai"
                          ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                          : w["STATUS"] === "Proses"
                            ? "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                            : "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                        }`}>
                        {w["STATUS"] === "Calon Wisudawan" ? "Calon" : w["STATUS"]}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold font-[var(--font-outfit)] text-[var(--color-text)] leading-tight">
                    {w["NAMA GELAR"] || w["NAMA MAHASISWA"] || "-"}
                  </h1>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{w["FAKULTAS"]}</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{w["PRODI"]}</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">NIM {w["NIM"]}</p>
                </div>

                <div className="shrink-0 grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                  {w["STATUS"] !== "Calon Wisudawan" && (
                    <>
                      {/* QR Toga */}
                      {showTogaInfo && (
                        <div
                          className="hidden md:flex flex-1 sm:flex-none flex-col items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-[var(--color-border)] rounded-xl text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all sm:w-[110px]"
                          onClick={() => setIsTogaOpen(true)}
                        >
                          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center">
                            <QrCode size={24} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Toga</p>
                          </div>
                        </div>
                      )}

                      {/* QR Undangan */}
                      {showUndanganInfo && (
                        <div
                          className="hidden md:flex flex-1 sm:flex-none flex-col items-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 border border-[var(--color-border)] rounded-xl text-center cursor-pointer hover:border-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all sm:w-[110px]"
                          onClick={() => setIsUndanganOpen(true)}
                        >
                          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center">
                            <QrCode size={24} className="text-rose-600 dark:text-rose-400" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wide">Undangan</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* IPK & Predikat */}
                  {w["STATUS"] !== "Calon Wisudawan" && (
                    <div className="col-span-2 sm:col-span-1 flex-1 sm:flex-none flex flex-col items-center justify-center gap-1.5 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-[var(--color-border)] rounded-xl text-center sm:w-[110px]">
                      <div className="flex items-center justify-center">
                        <span className="text-[28px] font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">{w["IPK"]}</span>
                      </div>
                      <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide leading-tight">{w["PREDIKAT"]}</p>
                    </div>
                  )}

                  {/* COUNTDOWN UNTUK CALON WISUDAWAN */}
                  {w["STATUS"] === "Calon Wisudawan" && p.registrationDateLabel && (
                    <div className="col-span-2 flex-1 sm:flex-none flex flex-col items-center justify-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-center">
                      <p className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5 uppercase tracking-wide">Batas Pendaftaran</p>

                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {Object.entries(timeLeft).map(([unit, value], idx, arr) => (
                          <div key={unit} className="flex items-center gap-1.5 sm:gap-2">
                            <div className="flex flex-col items-center justify-center shrink-0 min-w-[32px] sm:min-w-[36px]">
                              <span className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-300 font-mono tracking-wider">
                                {value.toString().padStart(2, "0")}
                              </span>
                              <span className="text-[8px] sm:text-[9px] text-amber-700/70 dark:text-amber-500/70 uppercase tracking-widest font-bold mt-0.5">
                                {unit}
                              </span>
                            </div>
                            {idx !== arr.length - 1 && (
                              <div className="text-lg sm:text-xl font-light text-amber-300 dark:text-amber-700/50 pb-3"> : </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <p className="text-[9px] sm:text-[10px] text-amber-700/90 dark:text-amber-500/90 mt-2 font-medium bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-md">
                        {p.registrationDateLabel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ════ MAIN GRID ═════════════════════════ */}
      <div className="px-4 sm:px-8 pt-6 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── KOLOM KIRI (STATIS) ───────────────── */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 lg:sticky lg:top-24 self-start">

          {/* Jadwal Wisuda */}
          {jadwalWisudaCard}

          {/* Jika Calon, tampilkan card Akademik dulu (tapi sembunyikan saat diedit) */}
          {w["STATUS"] === "Calon Wisudawan" && !isEditing && (
            <motion.div {...up(0.05)}>
              <Card>
                <CardTitle icon={<GraduationCap size={13} />} title="Data Akademik" />
                <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                  <InfoRow label="Fakultas" value={w["FAKULTAS"] || "-"} />
                  <InfoRow label="Program Studi" value={w["PRODI"] || "-"} />
                  <InfoRow label="IPK" value={w["IPK"] || "-"} />
                  <InfoRow label="Predikat" value={w["PREDIKAT"] || "-"} />
                  <InfoRow label="Tgl Yudisium" value={w["TANGGAL YUDISIUM"] || "-"} />
                </div>
                <div className="px-5 pb-3 flex flex-col gap-1.5">
                  <p className="text-xs text-[var(--color-text-subtle)] italic">* Dikelola oleh Admin, tidak dapat diubah secara langsung.</p>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 p-2.5 rounded-lg mt-1">
                    <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                      <span className="font-bold">Info:</span> Pengajuan perubahan data pada Data Akademik hanya bisa dilakukan jika telah melakukan pendaftaran wisuda.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ── KOLOM KANAN (DENGAN TAB) ───────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Header Area (Tabs & Desktop Actions) */}
          {!isEditing && w["STATUS"] !== "Calon Wisudawan" && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">

              {/* Capsule Tab */}
              <div className="flex items-center gap-2 w-fit overflow-x-auto pb-1 max-w-full no-scrollbar scroll-smooth snap-x">
                <button
                  onClick={(e) => {
                    setActiveTab("pelaksanaan");
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`px-4 h-9 rounded-full text-xs font-normal transition-all border whitespace-nowrap snap-center shrink-0 ${activeTab === "pelaksanaan"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
                    }`}
                >
                  Informasi
                </button>
                <button
                  onClick={(e) => {
                    setActiveTab("undangan");
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`px-4 h-9 rounded-full text-xs font-normal transition-all border whitespace-nowrap snap-center shrink-0 ${activeTab === "undangan"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
                    }`}
                >
                  Undangan
                </button>
                <button
                  onClick={(e) => {
                    setActiveTab("toga");
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`px-4 h-9 rounded-full text-xs font-normal transition-all border whitespace-nowrap snap-center shrink-0 ${activeTab === "toga"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
                    }`}
                >
                  Toga
                </button>

                <button
                  onClick={(e) => {
                    setActiveTab("perbaikan");
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`px-4 h-9 rounded-full text-xs font-normal transition-all border whitespace-nowrap snap-center shrink-0 ${activeTab === "perbaikan"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]"
                    }`}
                >
                  Perbaikan
                </button>
              </div>

            </div>
          )}

          {/* Global Warning: Masa Pendaftaran & Edit Data Telah Ditutup */}
          {!isEditing && !allowEditProfile && (
            <div className="flex flex-col sm:flex-row items-center gap-3 border rounded-xl px-4 py-3 bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Lock size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <p className="text-xs font-bold flex-1 text-rose-800 dark:text-rose-400">
                  Masa Pendaftaran & Edit Data Telah Ditutup oleh Admin
                </p>
              </div>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} noValidate className="flex flex-col gap-4 mb-10">
              {/* Tambahan opsi ubah foto saat edit */}
              <motion.div {...up(0.1)}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      {uploadStatus === 'uploading' ? <Loader2 size={20} className="text-blue-500 animate-spin" /> : <Camera size={20} className="text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">Foto Wisuda</h3>
                      <p className="text-xs text-blue-700/80 dark:text-blue-400/80">Perbarui foto profil (Pastikan latar merah, jas/blazer hitam)</p>
                    </div>
                  </div>
                  <label className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${uploadStatus === 'uploading' ? "bg-blue-400 cursor-not-allowed text-white opacity-70" : "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer"}`}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      disabled={uploadStatus === 'uploading'}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (file.size > 1 * 1024 * 1024) {
                            showToast("Ukuran file terlalu besar! Maksimal 1 MB.", "error");
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            setSelectedImageSrc(reader.result as string);
                            setIsCropModalOpen(true);
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                    <Camera size={14} />
                    {uploadStatus === 'uploading' ? "Mengunggah..." : "Ganti Foto"}
                  </label>
                </div>
              </motion.div>

              {/* Row 1: Toga (Full Width) */}
              {allowEditToga && (
                <motion.div {...up(0.15)}>
                  <Card>
                    <CardTitle icon={<GraduationCap size={13} />} title="Toga" isCompleted={!!formData["TOGA"]} />
                    <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                      <div className="flex flex-col sm:grid sm:grid-cols-[120px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
                        <span className="text-xs text-[var(--color-text-subtle)] font-medium">Ukuran Toga <span className="text-rose-500">✱</span></span>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-4 mt-1 sm:mt-0">
                            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                              <label key={size} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="toga_size"
                                  required
                                  value={size}
                                  checked={formData["TOGA"] === size}
                                  onChange={(e) => setFormData({ ...formData, "TOGA": e.target.value })}
                                  className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 bg-[var(--color-surface)]"
                                />
                                <span className="text-sm font-semibold text-[var(--color-text)]">{size}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Row 2: Data Pendaftaran & Kontak */}
              <motion.div {...up(0.2)}>
                <Card>
                  <CardTitle icon={<FileText size={13} />} title="Data Pendaftaran & Kontak" isCompleted={!!(formData["EMAIL"] && formData["TTL"] && formData["JENIS KELAMIN"])} />
                  <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                    {/* Email — wajib */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
                      <span className="text-xs text-[var(--color-text-subtle)] font-medium">Email <span className="text-rose-500">✱</span></span>
                      <input
                        type="email"
                        required
                        value={formData["EMAIL"] || ""}
                        onChange={(e) => setFormData({ ...formData, "EMAIL": e.target.value })}
                        placeholder="email@contoh.com"
                        className="text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {/* Tempat Lahir — wajib */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
                      <span className="text-xs text-[var(--color-text-subtle)] font-medium">Tempat Lahir <span className="text-rose-500">✱</span></span>
                      <input
                        type="text"
                        required
                        value={formData["TEMPAT_LAHIR"] || (formData["TTL"] ? formData["TTL"].split(',')[0]?.trim() : "")}
                        onChange={(e) => {
                          const tgl = formData["TANGGAL_LAHIR"] || (formData["TTL"] ? formData["TTL"].split(',')[1]?.trim() : "");
                          const formattedPlace = toTitleCase(e.target.value);
                          setFormData({ ...formData, "TEMPAT_LAHIR": formattedPlace, "TTL": `${formattedPlace}, ${tgl}` });
                        }}
                        placeholder="Watampone"
                        className="text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {/* Tanggal Lahir — wajib */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
                      <span className="text-xs text-[var(--color-text-subtle)] font-medium">Tanggal Lahir <span className="text-rose-500">✱</span></span>
                      <input
                        type="date"
                        required
                        value={(() => {
                          const rawTgl = formData["TANGGAL_LAHIR"] || (formData["TTL"] ? formData["TTL"].split(',')[1]?.trim() : "");
                          if (!rawTgl) return "";
                          const d = new Date(rawTgl);
                          if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
                          return rawTgl;
                        })()}
                        onChange={(e) => {
                          const tempat = formData["TEMPAT_LAHIR"] || (formData["TTL"] ? formData["TTL"].split(',')[0]?.trim() : "");
                          const d = new Date(e.target.value);
                          const tglFormatted = d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
                          setFormData({ ...formData, "TANGGAL_LAHIR": e.target.value, "TTL": `${tempat}, ${tglFormatted}` });
                        }}
                        className="text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    {/* Jenis Kelamin — wajib */}
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
                      <span className="text-xs text-[var(--color-text-subtle)] font-medium">Jenis Kelamin <span className="text-rose-500">✱</span></span>
                      <div className="flex flex-wrap gap-4 mt-1 sm:mt-0">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="jenis_kelamin"
                            required
                            value="L"
                            checked={formData["JENIS KELAMIN"] === "L"}
                            onChange={(e) => setFormData({ ...formData, "JENIS KELAMIN": e.target.value })}
                            className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 bg-[var(--color-surface)]"
                          />
                          <span className="text-sm font-semibold text-[var(--color-text)]">Laki-Laki</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="jenis_kelamin"
                            required
                            value="P"
                            checked={formData["JENIS KELAMIN"] === "P"}
                            onChange={(e) => setFormData({ ...formData, "JENIS KELAMIN": e.target.value })}
                            className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 bg-[var(--color-surface)]"
                          />
                          <span className="text-sm font-semibold text-[var(--color-text)]">Perempuan</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Row 3: Judul Skripsi (Full Width) */}
              <motion.div {...up(0.25)}>
                <Card>
                  <CardTitle icon={<FileText size={13} />} title="Judul Skripsi / Tesis" isCompleted={!!formData["JUDUL SKRIPSI / TESIS"]} />
                  <div className="px-5 py-4">
                    <textarea
                      required
                      className="w-full text-sm leading-relaxed text-[var(--color-text)] font-medium bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px] resize-y uppercase"
                      value={formData["JUDUL SKRIPSI / TESIS"] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[\r\n]+/g, ' ');
                        setFormData({ ...formData, "JUDUL SKRIPSI / TESIS": val.toUpperCase() });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                      rows={3}
                      placeholder="Masukkan judul skripsi / tesis ✱ wajib"
                    />
                  </div>
                </Card>
              </motion.div>

              {/* Row 3.5: Akademik read-only (hanya muncul jika bukan Calon) */}
              {w["STATUS"] !== "Calon Wisudawan" && (
                <motion.div {...up(0.25)}>
                  <Card>
                    <CardTitle icon={<GraduationCap size={13} />} title="Akademik" />
                    <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                      <InfoRow label="Fakultas" value={w["FAKULTAS"] || "-"} />
                      <InfoRow label="Program Studi" value={w["PRODI"] || "-"} />
                      <InfoRow label="IPK" value={w["IPK"] || "-"} />
                      <InfoRow label="Predikat" value={w["PREDIKAT"] || "-"} />
                      <InfoRow label="Tgl Yudisium" value={w["TANGGAL YUDISIUM"] || "-"} />
                    </div>
                    <div className="px-5 pb-3">
                      <p className="text-xs text-[var(--color-text-subtle)] italic">* Data akademik dikelola oleh Admin dan tidak dapat diubah.</p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Row 4: Opsional — Organisasi */}
              <motion.div {...up(0.3)}>
                <Card>
                  <CardTitle icon={<Users size={13} />} title="Data Organisasi (Opsional)" isCompleted={!!(formData["ORMAWA"])} />
                  <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
                      <span className="text-xs text-[var(--color-text-subtle)] font-medium">Ormawa</span>
                      <div className="flex flex-col gap-2 w-full">
                        <select
                          value={formData["ORMAWA"] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setFormData({ ...formData, "ORMAWA": "", "JABATAN DALAM ORMAWA": "" });
                              setIsJabatanLainnya(false);
                            } else {
                              setFormData({ ...formData, "ORMAWA": val });
                            }
                          }}
                          className="text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="">-- Pilih Ormawa --</option>
                          {ormawaOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-2 sm:items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
                      <span className="text-xs text-[var(--color-text-subtle)] font-medium">
                        Jabatan {!!formData["ORMAWA"] && <span className="text-rose-500">✱</span>}
                      </span>
                      <div className="flex flex-col gap-2 w-full">
                        <select
                          disabled={!formData["ORMAWA"]}
                          value={isJabatanLainnya ? "Lainnya" : (formData["JABATAN DALAM ORMAWA"] || "")}
                          onChange={(e) => {
                            if (e.target.value === "Lainnya") {
                              setIsJabatanLainnya(true);
                              setFormData({ ...formData, "JABATAN DALAM ORMAWA": "" });
                            } else {
                              setIsJabatanLainnya(false);
                              setFormData({ ...formData, "JABATAN DALAM ORMAWA": e.target.value });
                            }
                          }}
                          className={`text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 ${!formData["ORMAWA"] ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <option value="">-- Pilih Jabatan --</option>
                          {jabatanOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                        </select>
                        {isJabatanLainnya && (
                          <input
                            type="text"
                            disabled={!formData["ORMAWA"]}
                            placeholder="Ketik jabatan..."
                            value={formData["JABATAN DALAM ORMAWA"] || ""}
                            onChange={(e) => setFormData({ ...formData, "JABATAN DALAM ORMAWA": e.target.value })}
                            className={`text-sm font-semibold text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500 ${!formData["ORMAWA"] ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div {...up(0.3)} className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] text-[var(--color-text-muted)] rounded-xl font-medium transition-colors border border-[var(--color-border)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </motion.div>
            </form>
          ) : (
            <>
              {/* Konten Tab Lengkapi Data Awal */}
              {activeTab === "lengkapi_data" && (
                <div className="flex flex-col gap-4">
                  {/* Box ringkas info */}
                  <div className={`flex flex-col sm:flex-row items-center gap-3 border rounded-xl px-4 py-3 justify-between ${isFormLengkap ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50" : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50"}`}>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {isFormLengkap ? (
                        <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-100 dark:fill-emerald-900/30 shrink-0" />
                      ) : (
                        <FileText size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <p className={`text-xs font-bold flex-1 ${isFormLengkap ? "text-emerald-800 dark:text-emerald-400" : "text-amber-800 dark:text-amber-400"}`}>
                        {isFormLengkap ? "Data Persyaratan Wisuda Lengkap" : "Lengkapi Data Persyaratan Wisuda"}
                      </p>
                    </div>
                    {allowEditProfile ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                      >
                        <Pencil size={13} />
                        {isFormLengkap ? "Edit Data" : "Lengkapi Data"}
                      </button>
                    ) : (
                      <span className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold shrink-0 cursor-not-allowed">
                        <Lock size={13} /> Edit Ditutup
                      </span>
                    )}
                  </div>

                  {/* Box upload foto */}
                  <div className="flex flex-col gap-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {w["FOTO"] ? (
                          <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-100 dark:fill-emerald-900/30 shrink-0" />
                        ) : uploadStatus === 'uploading' ? (
                          <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" />
                        ) : (
                          <Camera size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <p className={`text-xs font-bold ${w["FOTO"] ? "text-emerald-700 dark:text-emerald-400"
                            : uploadStatus === 'uploading' ? "text-blue-600 dark:text-blue-400"
                              : "text-blue-800 dark:text-blue-400"
                            }`}>
                            {uploadStatus === 'uploading' ? "Sedang mengunggah foto..." : "Unggah Foto Wisuda"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setIsKetentuanFotoOpen(!isKetentuanFotoOpen)}
                          disabled={uploadStatus === 'uploading'}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-lg text-xs font-bold transition-all shrink-0 disabled:opacity-50"
                        >
                          {isKetentuanFotoOpen ? "Tutup Ketentuan" : "Lihat Ketentuan"}
                        </button>
                        <label className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${!allowEditProfile
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          : uploadStatus === 'uploading'
                            ? "bg-blue-400 cursor-not-allowed text-white opacity-70"
                            : "bg-blue-600 hover:bg-blue-700 active:scale-95 text-white cursor-pointer"
                          }`}>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            className="hidden"
                            disabled={!allowEditProfile || uploadStatus === 'uploading'}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];

                                // Maksimal 1 MB
                                if (file.size > 1 * 1024 * 1024) {
                                  showToast("Ukuran file terlalu besar! Maksimal 1 MB.", "error");
                                  e.target.value = '';
                                  return;
                                }

                                const reader = new FileReader();
                                reader.onload = () => {
                                  setSelectedImageSrc(reader.result as string);
                                  setIsCropModalOpen(true);
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                          />
                          {uploadStatus === 'uploading' ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Camera size={13} />
                          )}
                          {w["FOTO"] ? "Ganti Foto" : "Unggah Foto"}
                        </label>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isKetentuanFotoOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-3 pt-3 border-t border-blue-200 dark:border-blue-800 mt-1">
                            <div className="bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3">
                              <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide mb-2">⚠ Sangat Penting</p>
                              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                                Pastikan menggunakan pakaian Toga untuk Foto Wisuda
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {contohFotoUrl && (
                                <div className="col-span-1 sm:col-span-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col md:flex-row gap-5 items-center md:items-start">
                                  <div
                                    className="shrink-0 w-full max-w-xs md:max-w-md md:w-96 aspect-[1000/651] rounded-lg overflow-hidden border-2 border-emerald-400 bg-[var(--color-bg-secondary)] relative group cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setIsContohFotoZoomed(true)}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={contohFotoUrl} alt="Contoh Foto Wisudawan" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                      <div className="bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                        <Maximize size={24} className="text-white" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-1 flex flex-col justify-center">
                                    <p className="font-bold text-[var(--color-text)] mb-1 flex items-center gap-1.5"><BadgeCheck size={14} className="text-emerald-500" /> Contoh Foto Profil</p>
                                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                                      Gunakan foto dengan ukuran/rasio 3 x 4 berlatar belakang merah. Pastikan wajah terlihat jelas, menghadap lurus ke depan, dan mengenakan pakaian toga lengkap seperti referensi foto.
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 space-y-1">
                                <p className="font-bold text-[var(--color-text)] flex items-center gap-1">📋 Format Foto</p>
                                <ul className="text-[var(--color-text-muted)] space-y-0.5 list-disc list-inside leading-relaxed">
                                  <li>Latar Belakang: <strong className="text-[var(--color-text)]">MERAH</strong></li>
                                  <li>Ukuran/Rasio: <strong className="text-[var(--color-text)]">3 x 4</strong></li>
                                  <li>Format File: <strong className="text-[var(--color-text)]">JPG (Maks 1 MB)</strong></li>
                                  <li>Kualitas: Tajam, Jelas, Tidak Blur</li>
                                  <li className="text-rose-600 dark:text-rose-400 font-semibold">Bukan foto scan/AI/fotokopian!</li>
                                </ul>
                              </div>
                              <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 space-y-2">
                                <div>
                                  <p className="font-bold text-[var(--color-text)] mb-0.5">👔 Pakaian Pria</p>
                                  <p className="text-[var(--color-text-muted)] leading-snug">Menggunakan <strong className="text-[var(--color-text)]">Toga</strong>.</p>
                                </div>
                                <div>
                                  <p className="font-bold text-[var(--color-text)] mb-0.5">👘 Pakaian Wanita</p>
                                  <p className="text-[var(--color-text-muted)] leading-snug">Menggunakan <strong className="text-[var(--color-text)]">Toga</strong>.</p>
                                </div>
                                <div>
                                  <p className="font-bold text-[var(--color-text)] mb-0.5">😊 Posisi & Wajah</p>
                                  <ul className="text-[var(--color-text-muted)] list-disc list-inside space-y-0.5 leading-snug">
                                    <li>Badan & kepala tegak menghadap depan.</li>
                                    <li>Tidak memakai kacamata/masker/cadar.</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Box Daftar Wisuda */}
                  {isAllRequiredFilled && (
                    <div className="mt-2 p-[2px] rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500">
                      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-emerald-50 dark:bg-emerald-950/80 rounded-[14px] px-5 py-5 h-full">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-300 mb-1">Daftar Wisuda</h3>
                            <p className="text-xs font-medium text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
                              Anda telah melengkapi seluruh persyaratan. Lakukan konfirmasi pendaftaran sekarang untuk menggunakan kuota wisuda.
                            </p>
                          </div>
                        </div>
                        {allowEditProfile ? (
                          <button
                            onClick={() => setIsDaftarDialogOpen(true)}
                            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-xl text-sm font-bold transition-all"
                          >
                            Daftar Wisuda
                          </button>
                        ) : (
                          <span className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed">
                            <Lock size={16} /> Pendaftaran Ditutup
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Konten Tab Pelaksanaan */}
              {activeTab === "pelaksanaan" && (
                <>

                  {/* Hint Warning */}
                  {warningHint}

                  {/* Jadwal Wisuda (Mobile Only) */}
                  <div className="block lg:hidden mb-4">
                    {jadwalWisudaCard}
                  </div>

                  {/* Skripsi */}
                  <motion.div {...up(0.15)}>
                    <Card>
                      <CardTitle icon={<FileText size={13} />} title="Judul Skripsi / Tesis" />
                      <div className="px-5 py-4">
                        <p className="text-sm sm:text-sm leading-relaxed text-[var(--color-text)] font-medium">
                          &ldquo;{w["JUDUL SKRIPSI / TESIS"]}&rdquo;
                        </p>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Akademik & Organisasi & Lainnya */}
                  <motion.div {...up(0.2)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                      <CardTitle icon={<GraduationCap size={13} />} title="Akademik" />
                      <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                        <InfoRow label="Fakultas" value={w["FAKULTAS"]} />
                        <InfoRow label="Program Studi" value={w["PRODI"]} />
                        <InfoRow label="IPK" value={w["IPK"]} />
                        <InfoRow label="Predikat" value={w["PREDIKAT"]} />
                        <InfoRow label="Tgl Yudisium" value={w["TANGGAL YUDISIUM"] || "-"} />
                      </div>
                    </Card>
                    <Card>
                      <CardTitle icon={<Users size={13} />} title="Data Organisasi" />
                      <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                        <InfoRow label="Ormawa" value={w["ORMAWA"]} />
                        <InfoRow label="Jabatan" value={w["JABATAN DALAM ORMAWA"]} />
                      </div>
                    </Card>
                  </motion.div>

                  {showPrestasiCard && w["PRESTASI AKD"] && (() => {
                    const s = w["PRESTASI AKD"].toLowerCase();
                    let color = { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50", text: "text-emerald-700 dark:text-emerald-400", icon: "text-emerald-500" };
                    if (s.includes("pertama") || s.includes("kesatu") || s.includes("satu") || s.includes(" 1")) color = { bg: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50", text: "text-amber-700 dark:text-amber-400", icon: "text-amber-500" };
                    else if (s.includes("kedua") || s.includes("dua") || s.includes(" 2")) color = { bg: "bg-slate-50 border-slate-300 dark:bg-slate-800/40 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300", icon: "text-slate-400" };
                    else if (s.includes("ketiga") || s.includes("tiga") || s.includes(" 3")) color = { bg: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50", text: "text-orange-800 dark:text-orange-400", icon: "text-orange-500" };

                    return (
                      <motion.div {...up(0.12)} className="mb-4">
                        <Card className={`${color.bg} border rounded-2xl`}>
                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="shrink-0 bg-white/50 dark:bg-black/20 p-3 rounded-full">
                                <Award size={28} className={color.icon} />
                              </div>
                              <div>
                                <h4 className={`text-[10px] font-bold ${color.text} mb-0.5 uppercase tracking-wider opacity-80`}>Peringkat Prestasi Akademik</h4>
                                <p className={`text-base font-extrabold ${color.text} leading-tight`}>{w["PRESTASI AKD"]}</p>
                              </div>
                            </div>
                            <div className="sm:shrink-0 w-full sm:w-auto">
                              <DownloadSertifikatButton w={w} />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })()}

                  <motion.div {...up(0.15)}>
                    <Card>
                      <CardTitle icon={<FileText size={13} />} title="Data Pendaftaran" />
                      <div className="px-5 py-2 divide-y divide-[var(--color-border)]">
                        <InfoRow label="Waktu Daftar" value={fDT(w["TIMESTAMP"])} />
                        <InfoRow label="Email" value={w["EMAIL"]} />
                        <InfoRow label="Tempat, Tanggal Lahir" value={w["TTL"]} />
                        <InfoRow label="Jenis Kelamin" value={w["JENIS KELAMIN"] === "L" ? "Laki-Laki" : "Perempuan"} />
                      </div>
                    </Card>
                  </motion.div>
                </>
              )}

              {/* Konten Tab Toga */}
              {activeTab === "toga" && (
                <motion.div {...up(0.05)}>
                  {!showTogaInfo ? (
                    <Card className="py-16 px-6 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-[var(--font-outfit)] text-[var(--color-text)]">Informasi Toga Belum Dapat Diakses</h3>
                        <p className="text-sm text-[var(--color-text-muted)] max-w-sm mt-2 leading-relaxed mx-auto">
                          Panitia belum membuka akses untuk informasi penyewaan dan pengambilan toga. Silakan periksa kembali nanti.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <CardTitle icon={<GraduationCap size={13} />} title="Informasi Toga" />
                      <div className="p-5 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        {/* QR Section */}
                        <div className="shrink-0 flex flex-col items-center gap-3">
                          <div
                            className="rounded-xl p-2 bg-white cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setIsTogaOpen(true)}
                          >
                            {w["QR TOGA"] || w["ID WISUDA"] ? (
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={(w["QR TOGA"] || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(w["ID WISUDA"])}`).replace('size=300x300', 'size=300x300&ecc=H')}
                                  alt={`QR Toga ${w["NIM"]}`}
                                  className="w-[120px] h-[120px] object-contain"
                                />
                              </div>
                            ) : (
                              <QrCode size={120} className="text-emerald-700" strokeWidth={1.2} />
                            )}
                          </div>
                          <button
                            onClick={() => setIsTogaOpen(true)}
                            className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-emerald-100 transition-colors"
                          >
                            Buka Tiket Toga
                          </button>
                        </div>

                        {/* Detail Toga */}
                        <div className="flex-1 w-full flex flex-col justify-center">
                          <div className="divide-y divide-[var(--color-border)] mb-4">
                            <InfoRow label="Ukuran Toga" value={w["TOGA"]} />
                            <InfoRow label="Waktu Pengambilan" value={p.waktu_pengambilan_toga?.[w["FAKULTAS"]] || "Belum Ditentukan"} />
                            <InfoRow label="Tempat Pengambilan" value={p.tempat_pengambilan_toga || "Belum Ditentukan"} />
                          </div>

                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 mb-2 uppercase tracking-wide">
                              Catatan Pengambilan
                            </h4>
                            <ul className="text-xs text-amber-900/80 dark:text-amber-200/70 space-y-1.5 list-disc list-outside pl-4 leading-relaxed font-medium">
                              <li>Tunjukkan tiket atau QR Toga saat pengambilan.</li>
                              <li>Hadir sesuai waktu yang telah ditentukan.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* Konten Tab Undangan */}
              {activeTab === "undangan" && (
                <motion.div {...up(0.05)}>
                  {!showUndanganInfo ? (
                    <Card className="py-16 px-6 flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-[var(--font-outfit)] text-[var(--color-text)]">E-Undangan Belum Dapat Diakses</h3>
                        <p className="text-sm text-[var(--color-text-muted)] max-w-sm mt-2 leading-relaxed mx-auto">
                          Panitia belum membuka akses untuk E-Undangan dan tata tertib acara. Silakan periksa kembali nanti.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <CardTitle icon={<FileText size={13} />} title="Informasi Undangan" />
                      <div className="p-5 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        {/* QR Section */}
                        <div className="shrink-0 flex flex-col items-center gap-3">
                          <div
                            className="rounded-xl p-2 bg-white cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setIsUndanganOpen(true)}
                          >
                            {w["QR UNDANGAN"] || w["ID UNDANGAN"] ? (
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={(w["QR UNDANGAN"] || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(w["ID UNDANGAN"])}`).replace('size=300x300', 'size=300x300&ecc=H')}
                                  alt={`QR Undangan ${w["NIM"]}`}
                                  className="w-[120px] h-[120px] object-contain"
                                />
                              </div>
                            ) : (
                              <QrCode size={120} className="text-rose-700" strokeWidth={1.2} />
                            )}
                          </div>
                          <button
                            onClick={() => setIsUndanganOpen(true)}
                            className="text-xs text-rose-600 font-bold bg-rose-50 px-3 py-1.5 rounded-full cursor-pointer hover:bg-rose-100 transition-colors"
                          >
                            Buka E-Undangan
                          </button>
                        </div>

                        {/* Detail & Tata Tertib */}
                        <div className="flex-1 w-full flex flex-col justify-center">
                          <div className="divide-y divide-[var(--color-border)] mb-4">
                            <InfoRow label="Tempat" value={`${p.venue}, ${p.location}`} />
                            <InfoRow label="Sesi" value={w["SESI"]} />
                            <InfoRow label="Nomor Urut Kursi" value={`${w["URUT"]}`} />
                            <InfoRow label="Jam Sesi" value={w["SESI"] === "Sesi 1" || w["SESI"] === "SESI 1" ? p.session1 : p.session2} />
                          </div>

                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                            <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 mb-2 uppercase tracking-wide">
                              Tata Tertib
                            </h4>
                            <ul className="text-xs text-amber-900/80 dark:text-amber-200/70 space-y-1.5 list-disc list-outside pl-4 leading-relaxed font-medium">
                              <li>Hadir <span className="font-bold">30 menit</span> sebelum acara dimulai.</li>
                              <li>Menunjukkan <span className="font-bold">E-Undangan (QR Code)</span> saat registrasi.</li>
                              <li>Undangan ini berlaku untuk <span className="font-bold">1 Wisudawan</span> dan <span className="font-bold">1 orang Pendamping</span>.</li>
                              <li>Berpakaian rapi dan sopan.</li>
                              <li>Wajib menjaga ketertiban selama prosesi berlangsung.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}

              {/* ══ Konten Tab Perbaikan ══ */}
              {activeTab === "perbaikan" && (
                <motion.div {...up(0.05)} className="flex flex-col gap-4">

                  {/* Info Banner */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <ClipboardList size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-1">Informasi</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                          Menu <strong>Perbaikan</strong> hanya untuk perbaikan <strong>Data Akademik</strong> atau data awal yang diimpor oleh Admin, yaitu:
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {["Nama", "NIM", "Fakultas", "Prodi", "IPK", "Toga", "Predikat", "Tgl Yudisium"].map((f) => (
                            <span key={f} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-md border border-emerald-200 dark:border-emerald-700/50">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Ajukan */}
                  {allowPerbaikan ? (
                    (() => {
                      const hasActive = perbaikanList.some(p => p.status === "proses");
                      return hasActive ? (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                          <Clock size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                            Anda masih memiliki pengajuan yang sedang diproses. Tunggu respon admin terlebih dahulu.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsPerbaikanModalOpen(true)}
                          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all"
                        >
                          <Plus size={16} /> Ajukan Perbaikan
                        </button>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/50 rounded-xl">
                      <Lock size={15} className="text-slate-500 shrink-0" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Pengajuan perbaikan saat ini dinonaktifkan oleh Admin.
                      </p>
                    </div>
                  )}

                  {/* Daftar Pengajuan */}
                  {isPerbaikanLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="animate-spin text-emerald-500" size={28} />
                    </div>
                  ) : perbaikanList.length === 0 ? (
                    <Card className="py-12 px-6 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-full flex items-center justify-center">
                        <FileEdit size={22} className="text-emerald-400 dark:text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-text)] text-sm">Belum ada pengajuan</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs mx-auto leading-relaxed">
                          Klik tombol di atas untuk mengajukan permohonan perbaikan data akademik Anda.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {perbaikanList.map((item) => {
                        const statusCfg = {
                          proses: { label: "Sedang Diproses", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800/50", dot: "bg-blue-500" },
                          diterima: { label: "Diterima", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800/50", dot: "bg-emerald-500" },
                          ditolak: { label: "Ditolak", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800/50", dot: "bg-rose-500" },
                        }[item.status] || { label: item.status, color: "", bg: "", border: "", dot: "bg-slate-400" };
                        return (
                          <Card key={item.id}>
                            <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                                  {statusCfg.label}
                                </span>
                              </div>
                              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(item.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="px-5 py-4 flex flex-col gap-3">
                              <div>
                                <p className="text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider mb-1.5">Detail Pengajuan</p>
                                <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">{item.detail_perbaikan}</p>
                              </div>
                              {item.catatan_admin && (
                                <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5">
                                  <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Catatan Admin</p>
                                  <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">{item.catatan_admin}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

            </>
          )}

        </div>
      </div>


      {/* ════ FOOTER ════════════════════════════ */}
      <footer className="border-t border-[var(--color-border)] py-6 text-center relative z-10 bg-[var(--color-bg)]/80 backdrop-blur-md">
        <p className="text-xs text-[var(--color-text-subtle)] flex items-center gap-1.5 flex-wrap justify-center">
          <span>Dikelola oleh</span>
          <span className="font-semibold text-[var(--color-text-muted)]">Subbagian Layanan Akademik IAIN Bone</span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>untuk para wisudawan IAIN Bone</span>
          </span>
        </p>
      </footer>

      {/* ════ IMAGE PREVIEW MODAL ═══════════════ */}
      {isPreviewOpen && w["FOTO"] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden bg-transparent"
            style={{ aspectRatio: '3/4', width: 'auto', height: '90vh' }}
          >
            <Image
              src={getOptimizedGDriveUrl(w["FOTO"] as string)}
              alt={w["NAMA MAHASISWA"] || "Foto Wisuda"}
              fill
              className="object-contain bg-black/20"
              unoptimized
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      )}

      {/* ════ E-UNDANGAN MODAL ═══════════════════ */}
      {isUndanganOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setIsUndanganOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full h-full sm:h-auto sm:max-w-sm max-h-none sm:max-h-[92vh] overflow-y-auto no-scrollbar rounded-none sm:rounded-2xl bg-white text-gray-900 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {/* Header merah */}
            <div className="bg-red-600 py-3 px-4 text-center">
              <p className="text-white font-black text-sm tracking-widest uppercase">Untuk 1 Orang Pendamping</p>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center px-6 pt-4 pb-3 gap-1.5">
              {/* Logo */}
              <Image
                src="/logo.png"
                alt="Logo IAIN Bone"
                width={72}
                height={72}
                className="object-contain"
              />

              {/* Judul */}
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 leading-snug">E Undangan Wisuda</p>
                <p className="text-sm font-bold text-gray-900 leading-snug">{p.title}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Institut Agama Islam Negeri Bone</p>
              </div>

              {/* QR Code */}
              <div className="rounded-lg p-2 bg-white mt-1 mx-auto flex justify-center max-w-fit relative">
                {w["QR UNDANGAN"] || w["ID UNDANGAN"] ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(w["QR UNDANGAN"] || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(w["ID UNDANGAN"])}`).replace('size=300x300', 'size=300x300&ecc=H')}
                      alt={`QR Undangan ${w["NIM"]}`}
                      className="w-[160px] h-[160px] object-contain"
                    />
                  </div>
                ) : (
                  <QrCode size={160} className="text-rose-700" strokeWidth={1.2} />
                )}
              </div>

              {/* Info wisudawan */}
              <div className="text-center mt-0.5">
                <p className="text-sm font-black text-gray-900">{w["NAMA GELAR"]}</p>
                <p className="text-base font-mono font-bold tracking-wider text-gray-700 mt-0.5">{w["NIM"]}</p>
              </div>

              {/* Info Undangan */}
              <div className="text-center mt-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Sesi & Nomor Urut</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl font-black text-gray-900 uppercase">{w["SESI"]}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-xl font-black text-gray-900">NO. {w["URUT"]}</span>
                </div>
              </div>

              {/* Info sesi & tempat */}
              <div className="text-center mt-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Waktu dan Tempat</p>
                <p className="text-sm font-black text-gray-900">
                  {w["SESI"] === "Sesi 1" || w["SESI"] === "SESI 1" ? p.session1 : p.session2}
                </p>
                <p className="text-sm font-black text-gray-900">di {p.venue}, {p.location}</p>
              </div>

              {/* Divider */}
              <div className="w-full border-t-2 border-dashed border-gray-300 my-1" />

              {/* Catatan penting */}
              <div className="w-full text-center">
                <p className="text-xs font-black text-gray-900 mb-1.5">Catatan Penting:</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-700 leading-snug">Tunjukkan tiket atau QR Code Undangan saat registrasi.</p>
                  <p className="text-xs text-gray-700 leading-snug">Hadir <span className="text-rose-600 font-semibold">30 menit</span> sebelum acara dimulai.</p>
                  <p className="text-xs text-gray-700 leading-snug">Wajib menjaga ketertiban selama prosesi berlangsung.</p>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            {/* Tombol Kembali (Mobile) */}
            <div className="sticky bottom-0 p-4 bg-white border-t border-red-50 sm:hidden z-10 w-full mt-auto">
              <button
                onClick={() => setIsUndanganOpen(false)}
                className="w-full py-3.5 bg-rose-600 text-white font-bold rounded-xl active:bg-rose-700 transition-colors"
              >
                Kembali
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ════ TIKET TOGA MODAL ════════════════════ */}
      {isTogaOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setIsTogaOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full h-full sm:h-auto sm:max-w-sm max-h-none sm:max-h-[92vh] overflow-y-auto no-scrollbar rounded-none sm:rounded-2xl bg-white text-gray-900 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {/* Header emerald */}
            <div className="bg-emerald-700 py-3 px-4 text-center">
              <p className="text-white font-black text-sm tracking-widest uppercase">Tiket Pengambilan Toga</p>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center px-6 pt-4 pb-3 gap-1.5">
              {/* Logo */}
              <Image
                src="/logo.png"
                alt="Logo IAIN Bone"
                width={72}
                height={72}
                className="object-contain"
              />

              {/* Judul */}
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 leading-snug">Wisuda Program Sarjana dan Magister</p>
                <p className="text-sm font-bold text-gray-900 leading-snug">{p.title}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">Institut Agama Islam Negeri Bone</p>
              </div>

              {/* QR Code */}
              <div className="rounded-lg p-2 bg-white mt-1 mx-auto flex justify-center max-w-fit relative">
                {w["QR TOGA"] || w["ID WISUDA"] ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(w["QR TOGA"] || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(w["ID WISUDA"])}`).replace('size=300x300', 'size=300x300&ecc=H')}
                      alt={`QR Toga ${w["NIM"]}`}
                      className="w-[160px] h-[160px] object-contain"
                    />
                  </div>
                ) : (
                  <QrCode size={160} className="text-emerald-700" strokeWidth={1.2} />
                )}
              </div>

              {/* Info wisudawan */}
              <div className="text-center mt-0.5">
                <p className="text-sm font-black text-gray-900">{w["NAMA GELAR"]}</p>
                <p className="text-base font-mono font-bold tracking-wider text-gray-700 mt-0.5">{w["NIM"]}</p>
              </div>

              {/* Info Toga */}
              <div className="text-center mt-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Ukuran Toga</p>
                <p className="text-2xl font-black text-gray-900">{w["TOGA"]}</p>
              </div>

              {/* Waktu dan Tempat Pengambilan */}
              <div className="text-center mt-2">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Jadwal dan tempat Pengambilan Toga</p>
                <p className="text-sm font-black text-gray-900">{p.waktu_pengambilan_toga?.[w["FAKULTAS"]] || "Belum Ditentukan"}</p>
                <p className="text-sm font-black text-gray-900">di {p.tempat_pengambilan_toga || "Belum Ditentukan"}</p>
              </div>

              {/* Divider */}
              <div className="w-full border-t-2 border-dashed border-gray-300 my-1" />

              {/* Catatan penting */}
              <div className="w-full text-center">
                <p className="text-xs font-black text-gray-900 mb-1.5">Catatan Penting:</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-700 leading-snug">Tunjukkan tiket ini saat pengambilan toga</p>
                  <p className="text-xs text-gray-700 leading-snug">Hadir sesuai <span className="text-emerald-700 font-semibold">waktu yang telah ditentukan</span></p>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            {/* Tombol Kembali (Mobile) */}
            <div className="sticky bottom-0 p-4 bg-white border-t border-emerald-50 sm:hidden z-10 w-full mt-auto">
              <button
                onClick={() => setIsTogaOpen(false)}
                className="w-full py-3.5 bg-emerald-700 text-white font-bold rounded-xl active:bg-emerald-800 transition-colors"
              >
                Kembali
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {selectedImageSrc && (
        <CropModal
          isOpen={isCropModalOpen}
          imageSrc={selectedImageSrc as string}
          onClose={() => setIsCropModalOpen(false)}
          onApply={async (croppedAreaPixels) => {
            try {
              // Langkah 1: Crop foto
              const croppedFile = await getCroppedImg(selectedImageSrc as string, croppedAreaPixels, 0.9);
              if (!croppedFile) {
                showToast("Gagal memproses foto.", "error");
                return;
              }

              // Tutup CropModal & tampilkan loading
              setIsCropModalOpen(false);
              setUploadStatus('uploading');

              // Langkah 2: Upload ke Google Drive via GAS
              // Sertakan URL foto lama agar GAS bisa hapus file lama
              // Nama file: FOTO_[timestamp]_[KODE_FAKULTAS]_[NIM].jpg
              // Subfolder: Foto_[activePeriode.nama_periode] (dari DB periode_wisuda status='Sedang Dibuka')
              const result = await uploadFotoToGDrive(
                croppedFile,
                nim,
                {
                  fakultas: w["FAKULTAS"] ?? "",
                  periode: activePeriode?.nama_periode ?? w["PERIODE"] ?? "",
                },
                w["FOTO"] || null
              );

              // Langkah 3: Simpan URL baru ke Supabase
              await saveFotoWisudawan(nim, result.fileUrl);

              // Langkah 4: Update state lokal agar foto tampil tanpa reload
              setW((prev) => ({ ...prev, "FOTO": result.fileUrl }));
              setUploadStatus('success');
              showToast("✓ Foto berhasil diunggah!", "success");
            } catch (e: any) {
              console.error("Upload foto error:", e);
              setUploadStatus('error');
              showToast("Gagal mengunggah foto. " + (e?.message || "Coba lagi."), "error");
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={isDaftarDialogOpen}
        onClose={() => setIsDaftarDialogOpen(false)}
        onConfirm={async () => {
          setIsDaftarLoading(true);
          try {
            const result = await daftarWisuda(nim);
            setW((prev) => ({
              ...prev,
              "STATUS": "Terdaftar",
              "TERDAFTAR": result.terdaftar as any,
              "ID WISUDA": result.id_wisuda as any,
              "NAMA GELAR": result.nama_gelar as any,
              "PRODI SINGKAT": result.prodi_singkat as any,
            }));
            setIsDaftarDialogOpen(false);
            setActiveTab("pelaksanaan");
            showToast("✓ Selamat! Pendaftaran wisuda berhasil.", "success");
          } catch (e: any) {
            console.error('daftarWisuda error:', e);
            showToast("Gagal mendaftar: " + (e?.message || "Coba lagi."), "error");
          } finally {
            setIsDaftarLoading(false);
          }
        }}
        title="Daftar Wisuda Sekarang?"
        message={
          <div className="flex flex-col gap-3 text-left w-full">
            <p className="text-center text-sm leading-relaxed">
              Apakah Anda yakin mendaftar di periode <br />
              <span className="inline-block px-3 py-1 mt-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800/50">
                {activePeriode?.nama_periode || w["PERIODE"] || "-"}
              </span> ?
            </p>
          </div>
        }
        confirmText="Ya, Daftar Wisuda"
        cancelText="Batal"
        isDestructive={false}
        isLoading={isDaftarLoading}
      />
      <ConfirmDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={handlePasswordChange}
        title="Ubah Password"
        message={
          <div className="flex flex-col gap-3 text-left w-full mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--color-text)]">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[var(--color-text)]">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Tulis ulang password"
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        }
        confirmText="Simpan Password"
        cancelText="Batal"
        isDestructive={false}
        isLoading={isChangingPassword}
      />

      {/* ════ MODAL FORM PERBAIKAN ════════════════ */}
      <AnimatePresence>
        {isPerbaikanModalOpen && (
          <div
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => { setIsPerbaikanModalOpen(false); setPerbaikanDetail(""); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full sm:max-w-lg bg-[var(--color-bg)] rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <FileEdit size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Ajukan Perbaikan Data</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Sampaikan detail perubahan yang diperlukan</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsPerbaikanModalOpen(false); setPerbaikanDetail(""); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5 flex flex-col gap-4">
                {/* Info */}
                <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5">
                  <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide mb-1.5">Perhatian</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    Perbaikan <strong>hanya berlaku</strong> untuk data yang diimpor Admin:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {["Nama", "NIM", "Fakultas", "Prodi", "IPK", "Toga", "Predikat", "Tgl Yudisium"].map((f) => (
                      <span key={f} className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded border border-amber-200 dark:border-amber-700/50">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--color-text)]">
                    Detail Perbaikan <span className="text-rose-500">✱</span>
                  </label>
                  <textarea
                    value={perbaikanDetail}
                    onChange={(e) => setPerbaikanDetail(e.target.value)}
                    placeholder={"Contoh:\n- Nama saya tertulis 'Muh. Arif' seharusnya 'Muhammad Arif'\n- IPK saya tertulis 3.45 seharusnya 3.54\n- Prodi saya tertulis salah, seharusnya Hukum Ekonomi Syariah"}
                    rows={5}
                    maxLength={1000}
                    className="w-full px-4 py-3 text-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none leading-relaxed"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] text-right">{perbaikanDetail.length}/1000</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setIsPerbaikanModalOpen(false); setPerbaikanDetail(""); }}
                    className="flex-1 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm font-semibold rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitPerbaikan}
                    disabled={isSubmittingPerbaikan || !perbaikanDetail.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all"
                  >
                    {isSubmittingPerbaikan
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Send size={15} />
                    }
                    {isSubmittingPerbaikan ? "Mengirim..." : "Kirim Pengajuan"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Menu (Mobile/Tablet Only) */}
      {(() => {
        const navs = [];

        if (allowEditProfile) {
          navs.push({
            id: 'edit',
            label: isEditing ? 'Batal Edit' : 'Edit Profil',
            icon: isEditing ? <X size={18} /> : <FileEdit size={18} />,
            action: () => {
              if (!isEditing) setActiveTab("informasi");
              setIsEditing(!isEditing);
              window.scrollTo({ top: 0, behavior: "smooth" });
            },
            active: isEditing,
            color: isEditing ? "text-rose-600 dark:text-rose-400" : "text-[var(--color-text-subtle)] hover:text-emerald-600 dark:hover:text-emerald-400",
            activeBg: "bg-rose-100 dark:bg-rose-900/30"
          });
        }

        if (showTogaInfo) {
          navs.push({
            id: 'toga',
            label: 'Toga',
            icon: <GraduationCap size={18} />,
            action: () => {
              setIsTogaOpen(true);
            },
            active: isTogaOpen,
            color: isTogaOpen ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--color-text-subtle)] hover:text-emerald-600 dark:hover:text-emerald-400",
            activeBg: "bg-emerald-100 dark:bg-emerald-900/30"
          });
        }

        if (showUndanganInfo) {
          navs.push({
            id: 'undangan',
            label: 'Undangan',
            icon: <QrCode size={18} />,
            action: () => {
              setIsUndanganOpen(true);
            },
            active: isUndanganOpen,
            color: isUndanganOpen ? "text-emerald-700 dark:text-emerald-400" : "text-[var(--color-text-subtle)] hover:text-emerald-600 dark:hover:text-emerald-400",
            activeBg: "bg-emerald-100 dark:bg-emerald-900/30"
          });
        }

        navs.push({
          id: 'logout',
          label: 'Logout',
          icon: <LogOut size={18} />,
          action: handleLogout,
          active: false,
          color: "text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300",
          activeBg: ""
        });

        if (navs.length < 2) return null;

        return (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg)]/95 backdrop-blur-lg border-t border-[var(--color-border)] z-[45] pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-[60px] px-2">
              {navs.map((nav) => (
                <button
                  key={nav.id}
                  onClick={nav.action}
                  className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${nav.color}`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${nav.active ? nav.activeBg : ''}`}>
                    {nav.icon}
                  </div>
                  <span className={`text-[10px] font-bold ${nav.active ? '' : 'font-medium'}`}>{nav.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Modal Zoom Contoh Foto */}
      <AnimatePresence>
        {isContohFotoZoomed && contohFotoUrl && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              onClick={() => setIsContohFotoZoomed(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[var(--color-bg)] rounded-xl overflow-hidden shadow-2xl w-full max-w-4xl"
            >
              <button
                onClick={() => setIsContohFotoZoomed(false)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10 backdrop-blur-md"
              >
                <X size={20} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={contohFotoUrl} alt="Contoh Foto Wisudawan Close-Up" className="w-full h-auto object-contain max-h-[85vh] bg-black/50" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
