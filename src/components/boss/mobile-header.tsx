"use client";

import { BellIcon, CaretDownIcon } from "@/components/ui/icons";
import Image from "next/image";

interface MobileHeaderProps {
  branchName: string;
  hasUnreadNotification?: boolean;
  userAvatarUrl?: string;
  onBranchClick?: () => void;
  onNotificationClick?: () => void;
}

export function MobileHeader({
  branchName,
  hasUnreadNotification = true,
  userAvatarUrl,
  onBranchClick,
  onNotificationClick,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md">
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
            <button
              onClick={onBranchClick}
              className="group flex items-center gap-0.5 text-xs font-semibold text-slate-700 transition hover:text-indigo-600"
            >
              <span className="max-w-[130px] truncate">{branchName}</span>
              <CaretDownIcon
                size={12}
                weight="bold"
                className="text-slate-400 group-hover:text-indigo-600"
              />
            </button>
          </div>
          <span className="text-[11px] font-medium text-slate-400">
            Ana Sayfa
          </span>
        </div>
      </div>

      {/* Sağ: Bildirim & Profil */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onNotificationClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
          aria-label="Bildirimler"
        >
          <BellIcon size={18} weight="bold" />
          {hasUnreadNotification && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          )}
        </button>

        {/* Profil Avatarı */}
        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-tr from-indigo-100 to-purple-100 ring-1 ring-slate-100">
          {userAvatarUrl ? (
            <Image
              src={userAvatarUrl}
              alt="Profil"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-indigo-700">
              EB
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
