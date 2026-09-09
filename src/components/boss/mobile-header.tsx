"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CaretDownIcon, CheckIcon } from "@/components/ui/icons";

interface BranchOption {
  id: string;
  name: string;
  branchName?: string | null;
}

interface MobileHeaderProps {
  currentRestaurantId: string;
  currentBranchName: string;
  allBranches: BranchOption[];
  hasUnreadNotification?: boolean;
  userFullName?: string;
  userEmailOrPhone?: string;
  onNotificationClick?: () => void;
}

export function MobileHeader({
  currentRestaurantId,
  currentBranchName,
  allBranches,
  hasUnreadNotification = true,
  userFullName = "Yönetici",
  userEmailOrPhone,
  onNotificationClick,
}: MobileHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Baş harfleri al
  const initials = userFullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "OX";

  const handleSelectBranch = (id: string) => {
    setDropdownOpen(false);
    router.push(`/boss?restaurantId=${id}`);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
      {/* Sol: Logo + Şube Seçici + Sayfa Başlığı */}
      <div className="flex items-center gap-2.5">
        {/* Logo Sembolü */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-500/25">
          <span className="text-base font-black tracking-wider">O</span>
        </div>

        {/* Yazılar & Şube */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black tracking-tight text-slate-900">
              OXONOM
            </span>
            <span className="text-slate-300">·</span>

            {/* Şube Dropdown Tetikleyici */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="group flex items-center gap-0.5 text-xs font-semibold text-slate-700 transition hover:text-indigo-600 focus:outline-none"
              >
                <span className="max-w-[140px] truncate">{currentBranchName}</span>
                <CaretDownIcon
                  size={12}
                  weight="bold"
                  className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Şube Seçim Menüsü */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Şubeler ({allBranches.length})
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                      {allBranches.map((branch) => {
                        const isSelected = branch.id === currentRestaurantId;
                        const label = branch.branchName
                          ? `${branch.name} (${branch.branchName})`
                          : branch.name;
                        return (
                          <button
                            key={branch.id}
                            type="button"
                            onClick={() => handleSelectBranch(branch.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition ${
                              isSelected
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">{label}</span>
                            {isSelected && (
                              <CheckIcon size={14} weight="bold" className="text-indigo-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Ana Sayfa
          </span>
        </div>
      </div>

      {/* Sağ: Bildirim & Profil */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onNotificationClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 focus:outline-none"
          aria-label="Bildirimler"
        >
          <BellIcon size={18} weight="bold" />
          {hasUnreadNotification && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* Profil Avatarı & Bilgisi */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-gradient-to-tr from-indigo-100 to-purple-100 text-xs font-bold text-indigo-700 ring-1 ring-slate-100 focus:outline-none"
            aria-label="Profil Menüsü"
          >
            {initials}
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-bold text-slate-900">{userFullName}</p>
                    {userEmailOrPhone && (
                      <p className="truncate text-[10px] text-slate-500">{userEmailOrPhone}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-medium text-slate-600">
                    Aktif Rol: <span className="font-bold text-indigo-600">Patron / Yönetici</span>
                  </div>
                  <a
                    href="/dashboard/settings"
                    className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hesap Ayarları
                  </a>
                  <a
                    href="/api/mobile/auth/logout"
                    className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    Çıkış Yap
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
