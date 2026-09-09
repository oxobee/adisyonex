"use client";

import {
  SparkleIcon,
  TrendUpIcon,
  ArrowsLeftRightIcon,
} from "@/components/ui/icons";

interface BranchStatusCardProps {
  branchName: string;
  activeStaffCount: number;
  onlineDevicesCount: number;
  userName: string;
  targetOverPercent: number;
  onSwitchBranch?: () => void;
}

export function BranchStatusCard({
  branchName,
  activeStaffCount,
  onlineDevicesCount,
  userName,
  targetOverPercent,
  onSwitchBranch,
}: BranchStatusCardProps) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
      {/* Üst Kısım: Şube Durumu */}
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              {branchName}
            </h2>
          </div>
          <p className="mt-1 text-[12px] font-medium text-slate-500">
            {activeStaffCount} Personel Aktif · {onlineDevicesCount} Cihaz Çevrimiçi
          </p>
        </div>

        <button
          onClick={onSwitchBranch}
          className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 active:scale-95"
        >
          <span>Şube Değiştir</span>
          <ArrowsLeftRightIcon size={12} weight="bold" className="text-slate-500" />
        </button>
      </div>

      {/* Alt Kısım: AI / Akıllı Asistan Bilgilendirmesi */}
      <div className="border-t border-slate-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600">
              <SparkleIcon size={16} weight="fill" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                İyi günler, {userName}
              </div>
              <p className="text-[11px] font-medium text-slate-600">
                Bugün hedeflerin{" "}
                <span className="font-bold text-emerald-600">
                  %{targetOverPercent} üzerinde
                </span>{" "}
                gidiyorsunuz
              </p>
            </div>
          </div>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <TrendUpIcon size={15} weight="bold" />
          </div>
        </div>
      </div>
    </section>
  );
}
