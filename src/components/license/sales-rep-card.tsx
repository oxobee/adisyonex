"use client";

import Image from "next/image";
import {
  BriefcaseIcon,
  HeadphonesIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneCallIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LicenseSalesRepDTO } from "@/services/license.service";

export function SalesRepCard({
  salesRep,
  className,
}: {
  readonly salesRep?: LicenseSalesRepDTO | null;
  readonly className?: string;
}) {
  const repName = salesRep?.name || "Adisyon Destek & Satış Ekibi";
  const repTitle = salesRep?.title || "Müşteri ve Lisans Danışmanı";
  const repPhone = salesRep?.phone || "+90 (850) 000 00 00";
  const repEmail = salesRep?.email || "destek@adisyonex.com";
  const repWhatsapp = salesRep?.whatsapp || repPhone.replace(/[^0-9]/g, "");
  const repNotes =
    salesRep?.notes ||
    "Yetkili lisans danışmanınızla görüşerek lisansınızı anında yenileyebilirsiniz.";

  const initials =
    repName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  const cleanPhoneForCall = repPhone.replace(/\s+/g, "");
  const cleanWhatsappNumber = repWhatsapp.replace(/[^0-9]/g, "");

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 sm:p-5 text-left w-full shadow-lg backdrop-blur-md",
        className,
      )}
    >
      {/* Category Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300">
          <ShieldCheckIcon className="size-4 text-primary" />
          <span>Yetkili Satış ve Lisans Danışmanı</span>
        </span>

        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
          Aktif Temsilci
        </span>
      </div>

      {/* Rep Profile */}
      <div className="flex items-center gap-3.5 pb-3.5 border-b border-zinc-800">
        <div className="relative size-13 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
          {salesRep?.photoUrl ? (
            <Image
              src={salesRep.photoUrl}
              alt={repName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Avatar className="size-full rounded-xl">
              <AvatarFallback className="rounded-xl text-sm font-bold text-zinc-200 bg-zinc-800">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 truncate">
            {repName}
          </h3>
          <p className="text-xs text-primary font-medium mt-0.5 truncate">
            {repTitle}
          </p>
          {repNotes && (
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {repNotes}
            </p>
          )}
        </div>
      </div>

      {/* Contact Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3">
        {/* Phone */}
        <a
          href={`tel:${cleanPhoneForCall}`}
          className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-2.5 hover:border-zinc-700 hover:bg-zinc-800/40 transition-colors group"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <PhoneIcon className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-zinc-500">
              Telefon
            </span>
            <span className="block text-xs font-semibold text-zinc-200 group-hover:text-primary transition-colors truncate">
              {repPhone}
            </span>
          </div>
        </a>

        {/* Email */}
        <a
          href={`mailto:${repEmail}?subject=Lisans%20Yenileme%20Talebi`}
          className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-2.5 hover:border-zinc-700 hover:bg-zinc-800/40 transition-colors group"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
            <MailIcon className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-zinc-500">
              E-Posta
            </span>
            <span className="block text-xs font-semibold text-zinc-200 group-hover:text-primary transition-colors truncate">
              {repEmail}
            </span>
          </div>
        </a>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        {cleanWhatsappNumber && (
          <Button
            className="w-full sm:flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            render={
              <a
                href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
                  `Merhaba ${repName}, ${salesRep ? "" : "işletmemizin "}lisans yenileme ve paket uzatma işlemleri hakkında bilgi almak istiyorum.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageSquareIcon className="size-3.5 mr-1.5 shrink-0" />
            <span className="truncate">WhatsApp Destek Hattı</span>
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full sm:w-auto h-10 px-4 rounded-xl border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          render={<a href={`tel:${cleanPhoneForCall}`} />}
        >
          <PhoneCallIcon className="size-3.5 mr-1.5 shrink-0" />
          <span>Hemen Ara</span>
        </Button>
      </div>
    </div>
  );
}
