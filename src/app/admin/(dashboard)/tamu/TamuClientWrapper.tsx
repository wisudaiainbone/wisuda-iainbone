"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

type Props = {
  initialTab: string;
  isPresensiOnly: boolean;
  daftarControlsNode: React.ReactNode;
  daftarContentNode: React.ReactNode;
  scanNode: React.ReactNode;
};

export default function TamuClientWrapper({
  initialTab,
  isPresensiOnly,
  daftarControlsNode,
  daftarContentNode,
  scanNode,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab state with URL without triggering a hard navigation if possible
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL shallowly so it doesn't trigger server re-fetch
    window.history.pushState(null, "", `?tab=${tab}`);
  };

  useEffect(() => {
    const handleSwitch = (e: any) => handleTabChange(e.detail);
    window.addEventListener("switchTamuTab", handleSwitch);
    return () => window.removeEventListener("switchTamuTab", handleSwitch);
  }, []);

  return (
    <div className={`space-y-6 ${activeTab === "daftar" ? "pb-24 sm:pb-0" : ""}`}>
      {/* Header Actions - only show on daftar */}
      {activeTab === "daftar" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Tabs - Floating on mobile */}
          {!isPresensiOnly && (
            <div className="fixed sm:relative bottom-20 sm:bottom-auto left-0 right-0 sm:left-auto sm:right-auto px-4 sm:px-0 z-40 flex items-center justify-center sm:justify-start pointer-events-none sm:pointer-events-auto">
              <div className="flex w-full sm:w-auto items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => handleTabChange("daftar")}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-5 sm:px-4 h-[42px] sm:h-[38px] text-sm font-bold rounded-full transition-colors ${
                    (activeTab as string) === "daftar"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-[var(--color-surface)] sm:bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] shadow-sm sm:shadow-none border sm:border-transparent border-[var(--color-border)]"
                  }`}
                >
                  <span className="hidden sm:inline">Daftar Tamu</span>
                  <span className="sm:hidden">Daftar</span>
                </button>
                <button
                  onClick={() => handleTabChange("scan")}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-5 sm:px-4 h-[42px] sm:h-[38px] text-sm font-bold rounded-full transition-colors ${
                    (activeTab as string) === "scan"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-[var(--color-surface)] sm:bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] shadow-sm sm:shadow-none border sm:border-transparent border-[var(--color-border)]"
                  }`}
                >
                  <span className="hidden sm:inline">Scan Kehadiran</span>
                  <span className="sm:hidden">Scan</span>
                </button>
                
                {/* Mobile FAB Tambah */}
                {activeTab === "daftar" && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("openAddTamuModal"))}
                    className="sm:hidden flex items-center justify-center w-[42px] h-[42px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-transform active:scale-95 shrink-0"
                    title="Tambah Tamu"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Controls for Daftar */}
          {activeTab === "daftar" && daftarControlsNode}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {activeTab === "daftar" ? daftarContentNode : scanNode}
      </div>
    </div>
  );
}
