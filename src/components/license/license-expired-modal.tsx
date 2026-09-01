"use client";

import { AlertOctagonIcon, Building2Icon, CalendarX2Icon, LockIcon, LogOutIcon, ShieldAlertIcon } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { directStaffLogoutAction } from "@/actions/staff-auth.actions";
import { SalesRepCard } from "@/components/license/sales-rep-card";
import { Button } from "@/components/ui/button";
import type { LicenseInfoDTO } from "@/services/license.service";

const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Deneme Sürümü",
  MONTHLY: "Aylık Lisans",
  YEARLY: "Yıllık Lisans",
  LIFETIME: "Ömür Boyu",
};

export function LicenseExpiredModal({
  licenseInfo,
  isStaff = false,
}: {
  readonly licenseInfo: LicenseInfoDTO;
  readonly isStaff?: boolean;
}) {
  if (!licenseInfo.isExpired) {
    return null;
  }

  const expiryDateFormatted = licenseInfo.expiresAt
    ? new Date(licenseInfo.expiresAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Süresi Dolmuş";

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-zinc-950/90 p-4 sm:p-6 backdrop-blur-3xl overflow-y-auto animate-in fade-in duration-200">
      <div className="my-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        
        {/* Main Header & Status */}
        <div className="flex flex-col items-center gap-3 max-w-lg">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 shadow-sm">
            <ShieldAlertIcon className="size-7" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-red-500">
              Sistem Erişimi Durduruldu
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Lisans Süresi Sona Erdi
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              <strong className="text-zinc-200">{licenseInfo.restaurantName}</strong> işletmesine ait yazılım lisans süresi tamamlanmıştır. Sistem verileriniz ve kayıtlarınız güvenle korunmaktadır.
            </p>
          </div>

          {/* License Metadata Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-2 pt-3 border-t border-zinc-800/80 text-left">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
              <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
                İşletme
              </span>
              <span className="text-xs font-bold text-zinc-200 truncate block mt-0.5">
                {licenseInfo.restaurantName}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
              <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
                Lisans Paketi
              </span>
              <span className="text-xs font-bold text-zinc-200 truncate block mt-0.5">
                {PLAN_LABELS[licenseInfo.plan] || licenseInfo.plan}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-red-950/80 bg-red-950/20 p-2.5">
              <span className="text-[10px] font-semibold text-red-400 block uppercase tracking-wider">
                Bitiş Tarihi
              </span>
              <span className="text-xs font-bold text-red-300 truncate block mt-0.5">
                {expiryDateFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Sales & Renewal Contact Card */}
        <div className="w-full max-w-lg">
          <SalesRepCard salesRep={licenseInfo.salesRep} />
        </div>

        {/* Exit / Sign out option */}
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (isStaff) {
                await directStaffLogoutAction();
              } else {
                await logoutAction();
              }
            }}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
          >
            <LogOutIcon className="size-3.5 mr-1.5" />
            Farklı Bir Hesapla Giriş Yap / Oturumu Kapat
          </Button>
        </div>

      </div>
    </div>
  );
}
