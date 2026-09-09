"use client";

import { useState } from "react";
import { BellIcon, CheckIcon, StorefrontIcon } from "@/components/ui/icons";

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
  const [profileOpen, setProfileOpen] = useState(false);

  // Baş harfleri al
  const initials = userFullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "OX";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md">
      {/* Sol: Logo + Oxonom Yazısı + Sayfa Başlığı (Dropdown kaldırıldı) */}
      <div className="flex items-center gap-2.5">
        {/* Logo Sembolü */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm shadow-indigo-500/25">
          <span className="text-base font-black tracking-wider">O</span>
        </div>

        {/* Yazılar */}
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-tight text-slate-900">
            OXONOM
          </span>
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
              <div className="absolute right-0 mt-2 z-40 w-60 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                {/* Kullanıcı Özeti */}
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-bold text-slate-900">{userFullName}</p>
                    {userEmailOrPhone && (
                      <p className="truncate text-[10px] text-slate-500">{userEmailOrPhone}</p>
                    )}
                  </div>
                </div>

                {/* İşletme Adı (Aktif Rolün Üstünde) */}
                <div className="mt-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <StorefrontIcon size={13} className="text-indigo-600" weight="duotone" />
                    <span>İşletme / Şube</span>
                  </div>
                  <div className="mt-0.5 text-xs font-black text-slate-900 truncate">
                    {currentBranchName}
                  </div>
                </div>

                {/* Aktif Rol */}
                <div className="mt-2 px-1 text-[11px] font-medium text-slate-600">
                  Aktif Rol: <span className="font-bold text-indigo-600">Patron / Yönetici</span>
                </div>

                {/* Menü Linkleri */}
                <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2">
                  <a
                    href="/dashboard/settings"
                    className="block rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Hesap & Şube Ayarları
                  </a>
                  <a
                    href="/api/auth/logout"
                    className="block rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
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
