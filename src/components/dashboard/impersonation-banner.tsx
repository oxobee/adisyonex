"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ShieldAlertIcon } from "lucide-react";
import { stopImpersonatingAction } from "@/actions/admin-modules.actions";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner({
  restaurantName,
}: {
  readonly restaurantName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleExit = () => {
    startTransition(async () => {
      const res = await stopImpersonatingAction();
      if (res.success) {
        router.push(res.redirectUrl);
        router.refresh();
      }
    });
  };

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-4 py-2 text-white shadow-md text-xs sm:text-sm">
      <div className="flex items-center gap-2.5 font-bold min-w-0">
        <ShieldAlertIcon className="size-4.5 shrink-0 text-amber-200 animate-pulse" />
        <span className="truncate">
          <strong className="font-black text-amber-100 uppercase tracking-wide mr-1.5">
            Süper Admin Girişi:
          </strong>
          Şu anda <strong>&ldquo;{restaurantName}&rdquo;</strong> restoranı adına işlem yapıyorsunuz.
        </span>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={handleExit}
        className="rounded-xl bg-white text-gray-900 hover:bg-amber-50 font-black text-xs shadow-xs transition-all active:scale-95 cursor-pointer ml-auto shrink-0 border-0 h-8"
      >
        <ArrowLeftIcon className="size-3.5 mr-1" />
        {isPending ? "Çıkış Yapılıyor…" : "Süper Admin'e Dön"}
      </Button>
    </div>
  );
}
