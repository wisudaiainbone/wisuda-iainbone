"use client";

import { useState, useEffect, useRef } from "react";
import { warmUpTamuCache } from "@/actions/scanCache";
import { getRecentScans, getAllTamuScans } from "@/actions/scanHistory";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, CheckCircle2, XCircle, AlertCircle, RefreshCw, Users, Search, Database, ClipboardList, X, FileDown } from "lucide-react";

const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) { }
};

const speakResult = (status: 'success' | 'warning' | 'error', errorType?: string) => {
  let text = "Tidak Valid";
  if (status === 'success') {
    text = "Berhasil";
  } else if (status === 'warning') {
    if (errorType === 'already_taken') text = "Sudah hadir";
    else if (errorType === 'wrong_session') text = "Beda sesi";
    else text = "Perhatian";
  }
  
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    window.speechSynthesis.speak(utterance);
  } catch (e) { }
};

export default function ScanTamuClient({ initialMeta, isPresensiOnly = false }: { initialMeta: any, isPresensiOnly?: boolean }) {
  const [meta, setMeta] = useState(initialMeta);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [idInput, setIdInput] = useState("");
  const [activeSesi, setActiveSesi] = useState("Sesi Satu");
  const [showSesiMenu, setShowSesiMenu] = useState(false);

  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'warning' | 'error';
    message: string;
    data?: any;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  useEffect(() => {
    getRecentScans('tamu').then((res) => {
      if (res.success && res.data) {
        setRecentScans(res.data);
      }
    });
  }, []);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isInitializingRef = useRef(false);
  const lastScannedRef = useRef<string>("");
  const activeSesiRef = useRef(activeSesi);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(isProcessing);

  useEffect(() => { activeSesiRef.current = activeSesi; }, [activeSesi]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  const handleWarmUp = async () => {
    setIsWarmingUp(true);
    const res = await warmUpTamuCache();
    if (res.success) {
      setMeta({ cached_at: new Date().toISOString(), total: res.total });
    } else {
      alert("Gagal mengambil cache: " + res.error);
    }
    setIsWarmingUp(false);
  };

  const handleExportXlsx = async () => {
    setIsExporting(true);
    try {
      // Because tabel tamu doesn't use periode strictly for presence, we fetch all, or we could pass meta.periode if needed.
      const res = await getAllTamuScans(meta?.periode);
      if (!res.success || !res.data) {
        alert('Gagal mengambil data kehadiran tamu.');
        return;
      }
      const rows = res.data as any[];

      const kehadiranRows = [
        ['No', 'Nama', 'Jabatan', 'Sesi', 'Waktu Hadir'],
        ...rows.map((r, i) => [
          i + 1,
          r.nama,
          r.jabatan || '-',
          r.sesi || '-',
          r.hadir ? new Date(r.hadir).toLocaleString('id-ID') : '-',
        ]),
      ];

      const toXml = (sheet: any[][], sheetName: string) => {
        const esc = (v: any) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const rows = sheet.map((row, r) =>
          `<row r="${r+1}">${row.map((cell, c) => {
            const col = String.fromCharCode(65 + c);
            const ref = `${col}${r+1}`;
            const isNum = typeof cell === 'number';
            return isNum
              ? `<c r="${ref}" t="n"><v>${cell}</v></c>`
              : `<c r="${ref}" t="inlineStr"><is><t>${esc(cell)}</t></is></c>`;
          }).join('')}</row>`
        ).join('');
        return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
      };

      const sheets = [
        { name: 'Kehadiran Tamu', data: kehadiranRows }
      ];

      const workbookXml = `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${s.name}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
      const relsXml = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`;
      const contentTypes = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;

      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      zip.file('[Content_Types].xml', contentTypes);
      zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
      zip.file('xl/workbook.xml', workbookXml);
      zip.file('xl/_rels/workbook.xml.rels', relsXml);
      sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i+1}.xml`, toXml(s.data, s.name)));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
      a.href = url;
      a.download = `Kehadiran_Tamu_Wisuda_${now}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal export. Pastikan koneksi internet tersedia.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!isCameraActive) return;

    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    const startScanner = async () => {
      if (isInitializingRef.current || scannerRef.current) return;
      isInitializingRef.current = true;
      try {
        html5QrCode = new Html5Qrcode('qr-reader-tamu');
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, aspectRatio: 0.75, qrbox: (w, h) => { const s = Math.min(w, h) * 0.85; return { width: s, height: s }; }, disableFlip: false },
          async (decodedText) => {
            if (lastScannedRef.current === decodedText) return;
            playBeep();
            lastScannedRef.current = decodedText;
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = setTimeout(() => { lastScannedRef.current = ''; }, 2000);
            await processScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera start error', err);
      } finally {
        if (isMounted) isInitializingRef.current = false;
      }
    };

    const initTimer = setTimeout(() => {
      if (isMounted) startScanner();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      isInitializingRef.current = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => { html5QrCode?.clear(); }).catch(() => {});
      } else if (html5QrCode) {
        try { html5QrCode.clear(); } catch (_) {}
      }
      scannerRef.current = null;
    };
  }, [isCameraActive]);

  const handleIdSubmit = () => {
    const val = idInput.trim();
    if (!val) return;
    playBeep();
    processScan(val);
    setIdInput("");
  };

  const processScan = async (qrCode: string) => {
    if (isProcessingRef.current) return;
    
    // Validasi Format QR Tamu
    if (!qrCode.startsWith("Tamu_")) {
      speakResult('error');
      setScanResult({ status: 'error', message: 'QR Code tidak valid (Bukan tiket tamu).' });
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => { setScanResult(null); }, 3000);
      return;
    }
    
    setIsProcessing(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/scan/tamu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: qrCode, sesi: activeSesiRef.current }),
      });
      const dataRes = await res.json();
      
      if (dataRes.success) {
        speakResult('success');
        setScanResult({ status: 'success', message: dataRes.message, data: dataRes.data });
        setRecentScans((prev) => {
          if (prev.some(p => p.id === dataRes.data.id)) return prev;
          return [dataRes.data, ...prev];
        });
      } else {
        const isWarning = dataRes.error === 'already_taken' || dataRes.error === 'wrong_session';
        const status = isWarning ? 'warning' : 'error';
        speakResult(status, dataRes.error);
        setScanResult({
          status: status,
          message: dataRes.message || dataRes.error,
          data: dataRes.data,
        });
      }
    } catch {
      setScanResult({ status: 'error', message: 'Gagal terhubung ke server' });
      speakResult('error');
    } finally {
      setIsProcessing(false);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => { setScanResult(null); }, 3000);
    }
  };


  return (
    <div className="fixed inset-0 z-0 bg-[var(--color-bg)] flex flex-col pt-[72px] pb-6 px-4 lg:relative lg:inset-auto lg:z-auto lg:pt-0 lg:pb-0 lg:px-0 lg:bg-transparent lg:w-full lg:h-[calc(100vh-100px)] lg:flex-row gap-4 overflow-hidden">

      {/* ─── Kamera (Kiri) ─── */}
      <div className="relative w-full lg:w-1/2 h-full min-h-[50vh] overflow-hidden rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] mx-auto max-w-2xl lg:max-w-none flex-shrink-0 flex items-center justify-center">

        {/* ─── Info Badges (Selalu Tampil) ─── */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-row items-center justify-center gap-2 pointer-events-none w-full px-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
            <Users size={14} className="text-emerald-400" />
            <span className="text-white text-xs font-medium">
              {activeSesi}
            </span>
          </div>
          {meta && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-white text-xs font-medium">
                {meta.total} data
                {meta.cached_at && (
                  <span className="text-white/60 ml-1 font-normal">
                    • {new Date(meta.cached_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* ─── Tombol Navigasi Alternatif ─── */}
        {isPresensiOnly ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 lg:left-4 lg:translate-x-0 z-30">
            <a
              href="/admin/kehadiran"
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full font-bold text-sm transition-colors whitespace-nowrap"
            >
              Scan Wisudawan
            </a>
          </div>
        ) : (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 lg:left-4 lg:translate-x-0 z-30">
            <a
              href="?tab=daftar"
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white shadow-lg rounded-full font-bold text-sm transition-colors whitespace-nowrap"
            >
              Daftar Tamu
            </a>
          </div>
        )}

        {!isCameraActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[var(--color-surface)]">
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Camera size={48} className="text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--color-text)] mb-1">Scan Tamu</p>
              <p className="text-sm text-[var(--color-text-muted)]">Kamera belum aktif</p>
            </div>
          </div>
        ) : (
          <>
            {/* Sembunyikan tombol kontrol bawaan library saja */}
            <style dangerouslySetInnerHTML={{
              __html: `
              #qr-reader-tamu { width: 100% !important; border: none !important; }
              #qr-reader-tamu__dashboard_section_swaplink { display: none !important; }
              #qr-reader-tamu__dashboard_section_fsr { display: none !important; }
              #qr-reader-tamu__status_span { display: none !important; }
              #qr-reader-tamu__header_message { display: none !important; }
            `}} />

            {/* QR Reader — centered */}
            <div id="qr-reader-tamu" className="w-full" />

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center gap-4">
                <RefreshCw size={52} className="text-emerald-400 animate-spin" />
                <p className="text-white font-bold text-lg">Memproses...</p>
              </div>
            )}
            {/* Floating button untuk pindah ke Scan Wisuda (Mobile over camera) */}
            <div className="absolute top-4 left-0 right-0 z-30 flex justify-center lg:hidden pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full pointer-events-auto flex gap-3 shadow-2xl border border-white/10">
                <a href="/admin/kehadiran" className="text-white/60 hover:text-white font-medium text-sm transition-colors flex items-center">
                  Wisuda
                </a>
                <div className="w-px bg-white/20"></div>
                <span className="text-white font-bold text-sm flex items-center">
                  Tamu VIP
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Floating Actions (terkurung di kolom kiri/kamera) ─── */}
      <div className="absolute bottom-6 left-0 w-full lg:w-1/2 z-30 px-4">
        {isCameraActive ? (
          <div className="w-full max-w-lg mx-auto flex items-center gap-2">
            <input
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="Input ID Tamu..."
              className="flex-1 w-0 px-4 py-3.5 text-sm font-mono bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl placeholder:text-[var(--color-text-muted)]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleIdSubmit(); }}
            />
            <button
              onClick={handleIdSubmit}
              disabled={!idInput.trim() || isProcessing}
              className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
              title="Cari"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Cari</span>
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="lg:hidden px-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold shadow-xl text-sm transition-all active:scale-95 flex items-center justify-center shrink-0"
              title="Riwayat"
            >
              <ClipboardList size={18} className="text-emerald-600" />
            </button>
            <button
              onClick={() => setIsCameraActive(false)}
              className="px-4 py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-2xl font-bold shadow-xl text-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
              title="Matikan Kamera"
            >
              <CameraOff size={18} />
              <span className="hidden sm:inline">Off</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2">
              {/* Toggle Sesi: terpisah dan rounded-full */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSesi("Sesi Satu")}
                  className={`flex items-center justify-center w-12 h-12 font-black text-lg transition-all rounded-full shadow-xl ${
                    activeSesi === "Sesi Satu"
                      ? 'bg-emerald-600 text-white border-2 border-emerald-400'
                      : 'bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                  title="Sesi Satu"
                >
                  <span>1</span>
                </button>
                <button
                  onClick={() => setActiveSesi("Sesi Dua")}
                  className={`flex items-center justify-center w-12 h-12 font-black text-lg transition-all rounded-full shadow-xl ${
                    activeSesi === "Sesi Dua"
                      ? 'bg-emerald-600 text-white border-2 border-emerald-400'
                      : 'bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                  title="Sesi Dua"
                >
                  <span>2</span>
                </button>
              </div>

              {/* Tombol Cache */}
              <button
                onClick={handleWarmUp}
                disabled={isWarmingUp}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold shadow-xl text-sm transition-all active:scale-95 disabled:opacity-70"
                title="Cache"
              >
                <Database size={16} className={isWarmingUp ? "animate-pulse" : ""} />
                <span className="hidden sm:inline">{isWarmingUp ? "Loading" : "Cache"}</span>
              </button>

              <button
                onClick={() => setShowHistory(true)}
                className="lg:hidden flex items-center justify-center gap-2 px-4 py-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-2xl font-bold shadow-xl text-sm transition-all active:scale-95"
                title="Riwayat Scan Tamu"
              >
                <ClipboardList size={16} className="text-emerald-600" />
              </button>

              <button
                onClick={() => setIsCameraActive(true)}
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold shadow-xl text-sm transition-all active:scale-95 flex-1"
              >
                <Camera size={16} />
                <span className="hidden sm:inline">Scan</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Popup Hasil Scan ─── */}
      {(scanResult || isProcessing) && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 pointer-events-none lg:w-1/2 gap-4">
          <div
            className={`w-full max-w-sm pointer-events-auto rounded-3xl shadow-2xl border-2 p-6 flex flex-col items-center text-center animate-in zoom-in-90 duration-200 ${isProcessing
              ? 'bg-[var(--color-surface)] border-[var(--color-border)]'
              : scanResult?.status === 'success'
                ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/95 dark:border-emerald-500'
                : scanResult?.status === 'warning'
                  ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/95 dark:border-amber-500'
                  : 'bg-red-50 border-red-300 dark:bg-red-900/95 dark:border-red-500'
              }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={56} className="text-emerald-500 animate-spin mb-3" />
                <p className="font-bold text-[var(--color-text)]">Memproses...</p>
              </>
            ) : scanResult ? (
              <>
                {scanResult.status === 'success' && <CheckCircle2 size={72} className="text-emerald-500 mb-3" />}
                {scanResult.status === 'warning' && <AlertCircle size={72} className="text-amber-500 mb-3" />}
                {scanResult.status === 'error' && <XCircle size={72} className="text-red-500 mb-3" />}
                <h3 className={`text-2xl font-black mb-1 ${scanResult.status === 'success' ? 'text-emerald-700 dark:text-emerald-300' :
                  scanResult.status === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                  {scanResult.status === 'success' ? 'Berhasil!' : scanResult.status === 'warning' ? 'Perhatian' : 'Gagal'}
                </h3>
                <p className="text-sm font-medium text-[var(--color-text-muted)] mb-4">{scanResult.message}</p>
                {scanResult.data && (
                  <div className="w-full bg-white/70 dark:bg-black/20 rounded-2xl p-4 border border-white/50 dark:border-white/10 text-left">
                    <p className="font-black text-[var(--color-text)] text-base">{scanResult.data.nama}</p>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">{scanResult.data.jabatan || "-"}</p>
                    <div className="mt-3 p-3 rounded-xl flex items-center justify-center gap-2 bg-emerald-100/80 border-2 border-emerald-300 dark:bg-emerald-800/80 dark:border-emerald-600 font-bold text-emerald-900 dark:text-emerald-100">
                      Sesi: {scanResult.data.sesi}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {!isProcessing && scanResult && (
            <button
              onClick={() => setScanResult(null)}
              className={`pointer-events-auto px-6 py-2.5 rounded-full font-bold text-sm shadow-xl transition-all active:scale-95 animate-in slide-in-from-bottom-4 duration-200 flex items-center justify-center gap-2 ${
                scanResult.status === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : scanResult.status === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <X size={16} />
              Tutup
            </button>
          )}
        </div>
      )}

      {/* ─── Area Kanan (Daftar Hadir - Desktop) ─── */}
      <div className="hidden lg:flex flex-col w-1/2 h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex justify-between items-center">
          <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            Riwayat Kehadiran Tamu
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
              {recentScans.length} Scan Terbaru
            </span>
            <button
              onClick={handleExportXlsx}
              disabled={isExporting}
              title="Export XLSX"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg transition-all active:scale-95"
            >
              <FileDown size={14} className={isExporting ? 'animate-pulse' : ''} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-0 scrollbar-thin">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-[var(--color-surface)] text-[var(--color-text-muted)] text-xs uppercase z-10 border-b border-[var(--color-border)] shadow-sm">
              <tr>
                <th className="px-4 py-3.5 font-bold">Waktu</th>
                <th className="px-4 py-3.5 font-bold">Nama</th>
                <th className="px-4 py-3.5 font-bold">Jabatan</th>
                <th className="px-4 py-3.5 font-bold">Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {recentScans.length > 0 ? (
                recentScans.map((s, idx) => {
                  const waktu = s.hadir ? new Date(s.hadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
                  return (
                    <tr key={s.id || idx} className="hover:bg-[var(--color-bg-secondary)]/60 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap text-[var(--color-text-muted)] font-mono text-xs">{waktu}</td>
                      <td className="px-4 py-3.5 text-[var(--color-text)] max-w-[150px] truncate font-bold" title={s.nama}>{s.nama}</td>
                      <td className="px-4 py-3.5 text-[var(--color-text-subtle)] truncate max-w-[120px] text-xs">{s.jabatan || "-"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-bold text-xs">{s.sesi}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                      <Search size={32} className="mb-3 opacity-20" />
                      <p>Belum ada tamu hadir</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Riwayat (Mobile) ─── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-full h-[80vh] bg-[var(--color-surface)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300">
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-secondary)]">
              <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                Riwayat Kehadiran Tamu
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-[var(--color-border)] hover:bg-[var(--color-text-muted)] text-[var(--color-text)] rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="sticky top-0 bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[10px] sm:text-xs uppercase z-10 border-b border-[var(--color-border)] shadow-sm">
                  <tr>
                    <th className="px-2 py-3 font-bold">Waktu</th>
                    <th className="px-2 py-3 font-bold">Nama</th>
                    <th className="px-2 py-3 font-bold">Jabatan</th>
                    <th className="px-2 py-3 font-bold">Sesi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {recentScans.length > 0 ? (
                    recentScans.map((s, idx) => {
                      const waktu = s.hadir ? new Date(s.hadir).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
                      return (
                        <tr key={s.id || idx} className="hover:bg-[var(--color-bg-secondary)]/60 transition-colors">
                          <td className="px-2 py-3 whitespace-nowrap text-[var(--color-text-muted)] font-mono text-[10px] sm:text-xs">{waktu}</td>
                          <td className="px-2 py-3 text-[var(--color-text)] max-w-[100px] sm:max-w-[150px] truncate font-bold" title={s.nama}>{s.nama}</td>
                          <td className="px-2 py-3 text-[var(--color-text-subtle)] truncate max-w-[80px] sm:max-w-[120px] text-[10px] sm:text-xs">{s.jabatan || "-"}</td>
                          <td className="px-2 py-3 whitespace-nowrap text-indigo-600 dark:text-indigo-400 font-bold text-[10px] sm:text-xs">{s.sesi}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                          <Search size={32} className="mb-3 opacity-20" />
                          <p>Belum ada tamu hadir</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
