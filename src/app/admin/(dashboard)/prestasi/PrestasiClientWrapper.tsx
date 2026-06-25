"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  initialTab: string;
  akademikControlsNode: React.ReactNode;
  akademikActionButtonsNode?: React.ReactNode;
  akademikContentNode: React.ReactNode;
  organisasiContentNode: React.ReactNode;
};

export default function PrestasiClientWrapper({
  initialTab,
  akademikControlsNode,
  akademikActionButtonsNode,
  akademikContentNode,
  organisasiContentNode,
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

  return (
    <div className="space-y-6 pb-24 sm:pb-0">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        
        {/* Tabs - Floating on mobile */}
        <div className="fixed sm:relative bottom-20 sm:bottom-auto left-0 right-0 sm:left-auto sm:right-auto px-4 sm:px-0 z-40 flex items-center justify-center sm:justify-start pointer-events-none sm:pointer-events-auto">
          <div className="flex w-full sm:w-auto items-center gap-2 pointer-events-auto">
            <button
              onClick={() => handleTabChange("akademik")}
              className={`flex-1 sm:flex-none flex items-center justify-center px-5 sm:px-4 h-[42px] sm:h-[38px] text-sm font-bold rounded-full transition-colors ${
                activeTab === "akademik"
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--color-surface)] sm:bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] border sm:border-transparent border-[var(--color-border)]"
              }`}
            >
              <span className="hidden sm:inline">Prestasi Akademik</span>
              <span className="sm:hidden">Akademik</span>
            </button>
            <button
              onClick={() => handleTabChange("organisasi")}
              className={`flex-1 sm:flex-none flex items-center justify-center px-5 sm:px-4 h-[42px] sm:h-[38px] text-sm font-bold rounded-full transition-colors ${
                activeTab === "organisasi"
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--color-surface)] sm:bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] border sm:border-transparent border-[var(--color-border)]"
              }`}
            >
              <span className="hidden sm:inline">Pengalaman Organisasi</span>
              <span className="sm:hidden">Ormawa</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {akademikControlsNode}

          {/* Action Buttons (Generate, Slide, Print) under the filter on mobile */}
          {activeTab === "akademik" && akademikActionButtonsNode}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {activeTab === "akademik" && akademikContentNode}
        {activeTab === "organisasi" && organisasiContentNode}
      </div>
    </div>
  );
}
