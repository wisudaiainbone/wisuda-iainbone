"use client";

import { useState, useEffect, useRef } from "react";
import { getSetting, updateSetting, getAllSettingsAdmin } from "@/actions/settings";
import { getActivePeriode } from "@/actions/periode";
import { KeyRound, CheckCircle2, AlertCircle, Loader2, Shirt, Upload, ImageIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { uploadCertBackground, uploadCertSignature, extractSupabasePath, deleteCertAsset } from "@/lib/uploadCertBg";
import TogaSettingsForm from "./TogaSettingsForm";
import TamuSettingsForm from "./TamuSettingsForm";
import SlideSettingsForm from "./SlideSettingsForm";

export default function AdminPengaturanPage() {
  const { showToast } = useToast();
  const [defaultPassword, setDefaultPassword] = useState("");
  const [allowEditToga, setAllowEditToga] = useState(true);
  const [allowEditProfile, setAllowEditProfile] = useState(true);
  const [showTogaInfo, setShowTogaInfo] = useState(true);
  const [showUndanganInfo, setShowUndanganInfo] = useState(true);
  const [allowPerbaikan, setAllowPerbaikan] = useState(true);
  const [showPrestasiCard, setShowPrestasiCard] = useState(true);
  const [allowAbsensiLogin, setAllowAbsensiLogin] = useState(true);
  const [contactEmail, setContactEmail] = useState("");
  const [contactWa, setContactWa] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [allSettingsMap, setAllSettingsMap] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("general");
  const [activePeriode, setActivePeriode] = useState<any>(null);

  // Prestasi Akademik States
  const [certAkdNomor, setCertAkdNomor] = useState("");
  const [certAkdTanggal, setCertAkdTanggal] = useState("");
  const [certAkdJabatan, setCertAkdJabatan] = useState("");
  const [certAkdNip, setCertAkdNip] = useState("");
  const [certAkdNama, setCertAkdNama] = useState("");

  // Prestasi Organisasi States
  const [certOrgNomor, setCertOrgNomor] = useState("");
  const [certOrgTanggal, setCertOrgTanggal] = useState("");
  const [certOrgJabatan, setCertOrgJabatan] = useState("");
  const [certOrgNip, setCertOrgNip] = useState("");
  const [certOrgNama, setCertOrgNama] = useState("");

  const [certBgUrl, setCertBgUrl] = useState("");
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [certTtdUrl, setCertTtdUrl] = useState("");
  const [isUploadingTtd, setIsUploadingTtd] = useState(false);
  const ttdFileInputRef = useRef<HTMLInputElement>(null);

  const handleBgUpload = async (file: File) => {
    setIsUploadingBg(true);
    try {
      const oldPath = extractSupabasePath(certBgUrl);
      const result = await uploadCertBackground(file, oldPath);
      // Simpan langsung ke DB
      await updateSetting('cert_bg_url', result.publicUrl);
      setCertBgUrl(result.publicUrl);
      showToast('Gambar latar berhasil diupload!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload gagal.', 'error');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleRemoveBg = async () => {
    const oldPath = extractSupabasePath(certBgUrl);
    if (oldPath) await deleteCertAsset(oldPath);
    await updateSetting('cert_bg_url', '');
    setCertBgUrl('');
    showToast('Gambar latar dihapus.', 'success');
  };

  const handleTtdUpload = async (file: File) => {
    setIsUploadingTtd(true);
    try {
      const oldPath = extractSupabasePath(certTtdUrl);
      const result = await uploadCertSignature(file, oldPath);
      await updateSetting('cert_akd_ttd_url', result.publicUrl);
      setCertTtdUrl(result.publicUrl);
      showToast('Gambar tanda tangan berhasil diupload!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Upload gagal.', 'error');
    } finally {
      setIsUploadingTtd(false);
    }
  };

  const handleRemoveTtd = async () => {
    const oldPath = extractSupabasePath(certTtdUrl);
    if (oldPath) await deleteCertAsset(oldPath);
    await updateSetting('cert_akd_ttd_url', '');
    setCertTtdUrl('');
    showToast('Gambar tanda tangan dihapus.', 'success');
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [allSettings, periodeAktif] = await Promise.all([
          getAllSettingsAdmin(),
          getActivePeriode()
        ]);
        const settingsMap: Record<string, { value: string, description: string }> = {};
        allSettings.forEach((s: any) => {
          settingsMap[s.key] = { value: s.value, description: s.description };
        });

        const getVal = (key: string, def: string) => settingsMap[key]?.value ?? def;

        const descMap: Record<string, string> = {};
        const flatMap: Record<string, string> = {};
        Object.keys(settingsMap).forEach(key => {
          descMap[key] = settingsMap[key].description;
          flatMap[key] = settingsMap[key].value;
        });
        setDescriptions(descMap);
        setAllSettingsMap(flatMap);

        setDefaultPassword(getVal('default_password', 'wisuda2026'));
        setAllowEditToga(getVal('allow_edit_toga', 'true') === 'true');
        setAllowEditProfile(getVal('allow_edit_profile', 'true') === 'true');
        setShowTogaInfo(getVal('show_toga_info', 'true') === 'true');
        setShowUndanganInfo(getVal('show_undangan_info', 'true') === 'true');
        setAllowPerbaikan(getVal('allow_perbaikan', 'true') === 'true');
        setShowPrestasiCard(getVal('show_prestasi_card', 'true') === 'true');
        setAllowAbsensiLogin(getVal('allow_absensi_login', 'true') === 'true');
        setContactEmail(getVal('contact_email', 'wisuda@iainbone.ac.id'));
        setContactWa(getVal('contact_wa', '+62 811 9429 035'));

        setCertAkdNomor(getVal('cert_akd_nomor', ''));
        setCertAkdTanggal(getVal('cert_akd_tanggal', ''));
        setCertAkdJabatan(getVal('cert_akd_jabatan', 'Rektor'));
        setCertAkdNip(getVal('cert_akd_nip', ''));
        setCertAkdNama(getVal('cert_akd_nama', ''));

        setCertOrgNomor(getVal('cert_org_nomor', ''));
        setCertOrgTanggal(getVal('cert_org_tanggal', ''));
        setCertOrgJabatan(getVal('cert_org_jabatan', 'Rektor'));
        setCertOrgNip(getVal('cert_org_nip', ''));
        setCertOrgNama(getVal('cert_org_nama', ''));

        setCertBgUrl(getVal('cert_bg_url', ''));
        setCertTtdUrl(getVal('cert_akd_ttd_url', ''));

        setActivePeriode(periodeAktif);
      } catch (err) {
        console.error('Gagal memuat pengaturan', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const res1 = await updateSetting('default_password', defaultPassword);
    const res2 = await updateSetting('allow_edit_toga', allowEditToga ? 'true' : 'false');
    const res3 = await updateSetting('allow_edit_profile', allowEditProfile ? 'true' : 'false');
    const res4 = await updateSetting('show_toga_info', showTogaInfo.toString());
    const res5 = await updateSetting('show_undangan_info', showUndanganInfo.toString());
    const res6 = await updateSetting('allow_perbaikan', allowPerbaikan.toString());
    const resPrestasi = await updateSetting('show_prestasi_card', showPrestasiCard.toString());
    const resAbsensi = await updateSetting('allow_absensi_login', allowAbsensiLogin.toString());
    const res7 = await updateSetting('contact_email', contactEmail);
    const res8 = await updateSetting('contact_wa', contactWa);

    if (res1.success && res2.success && res3.success && res4.success && res5.success && res6.success && resPrestasi.success && resAbsensi.success && res7.success && res8.success) {
      showToast("Pengaturan berhasil diperbarui!", "success");
    } else {
      showToast(res1.error || res2.error || res3.error || "Gagal memperbarui pengaturan.", "error");
    }
    setIsSaving(false);
  };

  const handleSavePrestasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const r1 = await updateSetting('cert_akd_nomor', certAkdNomor);
    const r2 = await updateSetting('cert_akd_tanggal', certAkdTanggal);
    const r3 = await updateSetting('cert_akd_jabatan', certAkdJabatan);
    const r4 = await updateSetting('cert_akd_nip', certAkdNip);
    const r5 = await updateSetting('cert_akd_nama', certAkdNama);

    const r6 = await updateSetting('cert_org_nomor', certOrgNomor);
    const r7 = await updateSetting('cert_org_tanggal', certOrgTanggal);
    const r8 = await updateSetting('cert_org_jabatan', certOrgJabatan);
    const r9 = await updateSetting('cert_org_nip', certOrgNip);
    const r10 = await updateSetting('cert_org_nama', certOrgNama);

    const r11 = await updateSetting('cert_bg_url', certBgUrl);

    if (r1.success && r2.success && r3.success && r4.success && r5.success && r6.success && r7.success && r8.success && r9.success && r10.success && r11.success) {
      showToast("Pengaturan Prestasi berhasil diperbarui!", "success");
    } else {
      showToast("Gagal memperbarui pengaturan prestasi.", "error");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start pb-10">
      {/* Kolom Kiri (Menu) - 10% */}
      <div className="w-full lg:w-[10%] flex-shrink-0 lg:sticky lg:top-6">
        <div className="flex items-center lg:items-start lg:flex-col gap-2 lg:gap-4 py-2 w-full overflow-x-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: 'general', label: 'General' },
            { id: 'prestasi', label: 'Prestasi' },
            { id: 'toga', label: 'Toga' },
            { id: 'tamu', label: 'Tamu' },
            { id: 'slide', label: 'Slide' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 h-9 rounded-full text-xs font-semibold border transition-all lg:px-0 lg:h-auto lg:rounded-none lg:text-sm lg:font-bold lg:border-none lg:text-left
                ${activeTab === tab.id
                  ? 'bg-emerald-600 lg:bg-transparent text-white lg:text-emerald-600 dark:lg:text-emerald-400 border-emerald-600'
                  : 'bg-[var(--color-surface)] lg:bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] lg:hover:bg-transparent'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kolom Kanan (Konten) - 90% */}
      <div className="w-full lg:w-[90%] flex-1">
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24 sm:pb-0">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col">

              {/* Password Default */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                    Password Default
                  </h2>
                  {descriptions['default_password'] && (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['default_password']}
                    </p>
                  )}
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    id="defaultPassword"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Contoh: wisuda2026"
                    required
                  />
                </div>
              </div>

              {/* Kontak Email */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                    Email Bantuan
                  </h2>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                    Alamat email yang ditampilkan di halaman publik untuk bantuan informasi.
                  </p>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Contoh: wisuda@iainbone.ac.id"
                    required
                  />
                </div>
              </div>

              {/* Kontak WA/Telegram */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                    Nomor WhatsApp / Telegram
                  </h2>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                    Nomor yang dapat dihubungi, lengkap dengan format (+62...).
                  </p>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={contactWa}
                    onChange={(e) => setContactWa(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] font-mono focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Contoh: +62 811 9429 035"
                    required
                  />
                </div>
              </div>

              {/* Akses Edit Profile */}
              <label className="px-6 py-4 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                    Izinkan Pendaftaran & Edit Profil
                  </h2>
                  {descriptions['allow_edit_profile'] && (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['allow_edit_profile']}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-start shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={allowEditProfile}
                    onChange={(e) => setAllowEditProfile(e.target.checked)}
                  />
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${allowEditProfile ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowEditProfile ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </label>

              {/* Akses Edit Toga */}
              <label className="px-6 py-4 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)]">
                    Izinkan Edit Ukuran Toga
                  </h2>
                  {descriptions['allow_edit_toga'] && (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['allow_edit_toga']}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-start shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={allowEditToga}
                    onChange={(e) => setAllowEditToga(e.target.checked)}
                  />
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${allowEditToga ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowEditToga ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </label>

              {/* Tampilkan Toga */}
              <label className="px-6 py-4 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)]">
                    Tampilkan Informasi Toga
                  </h2>
                  {descriptions['show_toga_info'] && (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['show_toga_info']}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-start shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showTogaInfo}
                    onChange={(e) => setShowTogaInfo(e.target.checked)}
                  />
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${showTogaInfo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showTogaInfo ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </label>

              {/* Tampilkan Undangan */}
              <label className="px-6 py-4 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)]">
                    Tampilkan Informasi Undangan
                  </h2>
                  {descriptions['show_undangan_info'] && (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['show_undangan_info']}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-start shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showUndanganInfo}
                    onChange={(e) => setShowUndanganInfo(e.target.checked)}
                  />
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${showUndanganInfo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showUndanganInfo ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </label>

              {/* Izinkan Perbaikan Data */}
              <label className="px-6 py-4 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)]">
                    Izinkan Pengajuan Perbaikan Data
                  </h2>
                  {descriptions['allow_perbaikan'] ? (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['allow_perbaikan']}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      Izinkan wisudawan mengajukan perbaikan data akademik (Nama, NIM, Fakultas, Prodi, IPK, Toga, Predikat, Tgl Yudisium)
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-start shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={allowPerbaikan}
                    onChange={(e) => setAllowPerbaikan(e.target.checked)}
                  />
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${allowPerbaikan ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowPerbaikan ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </label>

              {/* Izinkan Akses Presensi */}
              <label className="px-6 py-4 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)]">
                    Buka Akses Admin Absensi (Tanpa Login)
                  </h2>
                  {descriptions['allow_absensi_login'] ? (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['allow_absensi_login']}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      Izinkan Panitia Absensi mengakses rute /admin/kehadiran dengan menggunakan Password Default Calon Wisudawan.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-start shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={allowAbsensiLogin}
                    onChange={(e) => setAllowAbsensiLogin(e.target.checked)}
                  />
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${allowAbsensiLogin ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${allowAbsensiLogin ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </label>

              {/* Tampilkan Kartu Prestasi */}
              <label className="px-6 py-4 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 cursor-pointer hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-[var(--color-text)]">
                    Munculkan Kartu Prestasi di halaman Wisudawan
                  </h2>
                  {descriptions['show_prestasi_card'] ? (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      {descriptions['show_prestasi_card']}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                      Menampilkan Kartu Prestasi Akademik di halaman profil jika wisudawan memiliki predikat terbaik tingkat Fakultas/Institut.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-start shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showPrestasiCard}
                    onChange={(e) => setShowPrestasiCard(e.target.checked)}
                  />
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${showPrestasiCard ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${showPrestasiCard ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>
              </label>

            </div>

            {/* Action Bar */}
            <div className="fixed sm:static bottom-20 sm:bottom-auto left-0 right-0 sm:left-auto sm:right-auto px-4 sm:px-0 z-40 flex sm:block pointer-events-none sm:pointer-events-auto sm:mt-8 sm:pt-6 sm:border-t sm:border-[var(--color-border)]">
              <div className="flex w-full sm:w-auto items-center sm:justify-end pointer-events-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 h-[42px] sm:h-auto sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-full sm:rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-900/20 active:scale-95"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'prestasi' && (
          <form onSubmit={handleSavePrestasi} className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24 sm:pb-0">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden flex flex-col">

              {/* === Background Upload === */}

              {/* === Background Upload === */}
              <div className="px-6 py-4 flex flex-col gap-5 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[var(--color-text)]">Background Sertifikat (Opsional)</h3>
                    <p className="text-xs text-[var(--color-text-subtle)] mt-1 leading-relaxed">
                      Upload gambar PNG/JPG/WEBP (maks 5 MB) ukuran A4 landscape sebagai latar sertifikat. Disimpan otomatis ke Supabase Storage.
                    </p>
                  </div>

                  {/* Preview + Actions */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    {certBgUrl ? (
                      <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={certBgUrl}
                          alt="Preview background"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => bgFileInputRef.current?.click()}
                            disabled={isUploadingBg}
                            className="p-2 rounded-full bg-white/90 text-emerald-700 hover:bg-white transition-colors"
                            title="Ganti gambar"
                          >
                            <Upload size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveBg}
                            disabled={isUploadingBg}
                            className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors"
                            title="Hapus gambar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => bgFileInputRef.current?.click()}
                        disabled={isUploadingBg}
                        className="w-48 h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer bg-[var(--color-bg)]"
                      >
                        {isUploadingBg ? (
                          <Loader2 size={24} className="animate-spin text-emerald-500" />
                        ) : (
                          <ImageIcon size={24} />
                        )}
                        <span className="text-xs font-medium">
                          {isUploadingBg ? 'Mengupload...' : 'Pilih Gambar'}
                        </span>
                      </button>
                    )}

                    {isUploadingBg && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                        <Loader2 size={12} className="animate-spin" />
                        Mengupload ke Supabase...
                      </div>
                    )}
                  </div>
                </div>

                {/* Hidden file input */}
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBgUpload(file);
                    // Reset agar file yang sama bisa dipilih ulang
                    e.target.value = '';
                  }}
                />
              </div>

              {/* === Upload Tanda Tangan === */}
              <div className="px-6 py-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Tanda Tangan Pejabat</h3>
                  <p className="text-xs text-[var(--color-text-subtle)] mt-1.5 leading-relaxed">
                    PNG transparan direkomendasikan. Akan di-overlay di area tanda tangan sertifikat (maks 2 MB).
                  </p>
                </div>

                <div className="w-full sm:w-auto shrink-0 flex flex-col items-center gap-3">
                  <div className="relative group">
                    {certTtdUrl ? (
                      <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-sm group bg-[var(--color-bg)] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23e5e7eb%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23e5e7eb%22%2F%3E%3C%2Fsvg%3E')]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={certTtdUrl} alt="Preview TTD" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button type="button" onClick={() => ttdFileInputRef.current?.click()} disabled={isUploadingTtd} className="p-2 rounded-full bg-white/90 text-emerald-700 hover:bg-white transition-colors" title="Ganti"><Upload size={14} /></button>
                          <button type="button" onClick={handleRemoveTtd} disabled={isUploadingTtd} className="p-2 rounded-full bg-white/90 text-red-600 hover:bg-white transition-colors" title="Hapus"><X size={14} /></button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => ttdFileInputRef.current?.click()} disabled={isUploadingTtd}
                        className="w-48 h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-emerald-400 hover:text-emerald-600 transition-colors cursor-pointer bg-[var(--color-bg)]">
                        {isUploadingTtd ? <Loader2 size={24} className="animate-spin text-emerald-500" /> : <Upload size={24} />}
                        <span className="text-xs font-medium">{isUploadingTtd ? 'Mengupload...' : 'Upload TTD'}</span>
                      </button>
                    )}
                  </div>
                  <input ref={ttdFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleTtdUpload(f); e.target.value = ''; }} />
                </div>
              </div>

              {/* === Prestasi Akademik === */}
              <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)] mt-2">
                <h2 className="text-base font-bold text-[var(--color-text)]">Sertifikat Prestasi Akademik</h2>
              </div>

              {/* Nomor Akademik */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Nomor Sertifikat</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certAkdNomor}
                    onChange={(e) => setCertAkdNomor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="B-xxxx/In.34/..."
                  />
                </div>
              </div>

              {/* Tanggal Akademik */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Tanggal Sertifikat</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certAkdTanggal}
                    onChange={(e) => setCertAkdTanggal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Watampone, 20 Juni 2026"
                  />
                </div>
              </div>

              {/* Jabatan Akademik */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Jabatan Penandatangan</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certAkdJabatan}
                    onChange={(e) => setCertAkdJabatan(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Rektor"
                  />
                </div>
              </div>

              {/* NIP Akademik */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">NIP/NIM Penandatangan</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certAkdNip}
                    onChange={(e) => setCertAkdNip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="NIP. xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* Nama Akademik */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Nama Penandatangan</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certAkdNama}
                    onChange={(e) => setCertAkdNama(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Prof. Dr. H. Syahabuddin, M.Ag."
                  />
                </div>
              </div>

              {/* === Prestasi Organisasi === */}
              <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)] mt-4">
                <h2 className="text-base font-bold text-[var(--color-text)]">Sertifikat Prestasi Organisasi</h2>
              </div>

              {/* Nomor Organisasi */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Nomor Sertifikat</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certOrgNomor}
                    onChange={(e) => setCertOrgNomor(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="B-xxxx/In.34/..."
                  />
                </div>
              </div>

              {/* Tanggal Organisasi */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Tanggal Sertifikat</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certOrgTanggal}
                    onChange={(e) => setCertOrgTanggal(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Watampone, 20 Juni 2026"
                  />
                </div>
              </div>

              {/* Jabatan Organisasi */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Jabatan Penandatangan</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certOrgJabatan}
                    onChange={(e) => setCertOrgJabatan(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Rektor"
                  />
                </div>
              </div>

              {/* NIP Organisasi */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">NIP/NIM Penandatangan</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certOrgNip}
                    onChange={(e) => setCertOrgNip(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="NIP. xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* Nama Organisasi */}
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-[var(--color-bg-secondary)]/50 transition-colors border-t border-[var(--color-border)]">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Nama Penandatangan</h3>
                </div>
                <div className="w-full sm:w-64 shrink-0">
                  <input
                    type="text"
                    value={certOrgNama}
                    onChange={(e) => setCertOrgNama(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                    placeholder="Prof. Dr. H. Syahabuddin, M.Ag."
                  />
                </div>
              </div>

            </div>
            
            {/* Action Bar */}
            <div className="fixed sm:static bottom-20 sm:bottom-auto left-0 right-0 sm:left-auto sm:right-auto px-4 sm:px-0 z-40 flex sm:block pointer-events-none sm:pointer-events-auto sm:mt-8 sm:pt-6 sm:border-t sm:border-[var(--color-border)]">
              <div className="flex w-full sm:w-auto items-center sm:justify-end pointer-events-auto">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 h-[42px] sm:h-auto sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-full sm:rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-900/20 active:scale-95"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan Prestasi"}
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'toga' && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activePeriode ? (
              <TogaSettingsForm activePeriode={activePeriode} />
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm p-12 flex flex-col items-center justify-center">
                <AlertCircle size={40} className="text-[var(--color-text-muted)] opacity-50 mb-4" />
                <p className="text-[var(--color-text-muted)] text-sm font-medium text-center">Tidak ada periode wisuda yang sedang aktif.<br />Silakan aktifkan periode terlebih dahulu di menu Periode.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'tamu' && (
          <TamuSettingsForm initialData={allSettingsMap} />
        )}
        {activeTab === 'slide' && (
          <SlideSettingsForm initialData={allSettingsMap} />
        )}
      </div>
    </div>
  );
}
