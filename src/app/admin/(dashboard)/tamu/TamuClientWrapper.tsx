"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        {!isPresensiOnly && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTabChange("daftar")}
              className={`flex items-center justify-center px-4 h-[38px] text-sm font-bold rounded-full transition-colors ${
                activeTab === "daftar"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              Daftar Tamu
            </button>
            <button
              onClick={() => handleTabChange("scan")}
              className={`flex items-center justify-center px-4 h-[38px] text-sm font-bold rounded-full transition-colors ${
                activeTab === "scan"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]"
              }`}
            >
              Scan Kehadiran
            </button>
          </div>
        )}

        {/* Action Controls for Daftar */}
        {activeTab === "daftar" && daftarControlsNode}
      </div>

      <div className="flex flex-col gap-6">
        {activeTab === "daftar" ? daftarContentNode : scanNode}
      </div>
    </div>
  );
}
