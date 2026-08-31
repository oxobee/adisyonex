"use client";

import { AlertTriangleIcon, ClockIcon, LockIcon, LogOutIcon, ShieldAlertIcon } from "lucide-react";
import { logoutAction } from "@/actions/auth.actions";
import { directStaffLogoutAction } from "@/actions/staff-auth.actions";
import { SalesRepCard } from "@/components/license/sales-rep-card";
import { Button } from "@/components/ui/button";
import type { LicenseInfoDTO } from "@/services/license.service";

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

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-background/80 p-4 backdrop-blur-2xl overflow-y-auto animate-in fade-in-0 duration-300">
      <div className="my-auto flex w-full max-w-xl flex-col gap-5 text-center">
        {/* Warning Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-destructive/30 bg-destructive/10 p-6 shadow-2xl">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/20 text-destructive shadow-inner ring-8 ring-destructive/10 animate-bounce">
            <LockIcon className="size-8" />
          </div>

          <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Lisansınızın Süresi Dolmuştur
          </h2>

          <p className="mt-2 text-sm sm:text-base font-semibold text-destructive leading-relaxed">
            Lütfen satış temsilcinizle iletişime geçiniz!
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            İşletmeniz ({licenseInfo.restaurantName}) için aktif bir abonelik veya lisans yenilemesi gerekmektedir.
          </p>
        </div>

        {/* Sales Representative Card */}
        <SalesRepCard salesRep={licenseInfo.salesRep} />

        {/* Footer: Sign Out Action */}
        <div className="flex items-center justify-center pt-2">
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
            className="text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
          >
            <LogOutIcon className="size-3.5 mr-1.5" />
            Farklı Bir Hesapla Giriş Yap / Çıkış
          </Button>
        </div>
      </div>
    </div>
  );
}
