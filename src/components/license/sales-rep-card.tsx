"use client";

import Image from "next/image";
import {
  BriefcaseIcon,
  HeadphonesIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneCallIcon,
  PhoneIcon,
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
  readonly compact?: boolean;
}) {
  const repName = salesRep?.name || "Adisyon Destek & Satış Ekibi";
  const repTitle = salesRep?.title || "Müşteri ve Lisans Danışmanı";
  const repPhone = salesRep?.phone || "+90 (850) 000 00 00";
  const repEmail = salesRep?.email || "destek@elitalerestro.com";
  const repWhatsapp = salesRep?.whatsapp || repPhone.replace(/[^0-9]/g, "");
  const repNotes =
    salesRep?.notes ||
    "Hafta içi & Hafta sonu kesintisiz destek ve lisans uzatma hizmeti alabilirsiniz.";

  const initials =
    repName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "ST";

  const cleanPhoneForCall = repPhone.replace(/\s+/g, "");
  const cleanWhatsappNumber = repWhatsapp.replace(/[^0-9]/g, "");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 p-4 sm:p-6 shadow-xl text-left w-full",
        className,
      )}
    >
      {/* Top Background Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />

      {/* Category Badge & Status Header */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-primary shadow-2xs">
          <HeadphonesIcon className="size-3.5 shrink-0" />
          <span>Yetkili Satış Temsilciniz</span>
        </span>

        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Çevrimiçi
        </span>
      </div>

      {/* Main Rep Profile */}
      <div className="flex items-center gap-3 sm:gap-4 pb-4 border-b border-border/60">
        <div className="relative size-14 sm:size-18 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/30 shadow-md bg-primary/10">
          {salesRep?.photoUrl ? (
            <Image
              src={salesRep.photoUrl}
              alt={repName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <Avatar className="size-full rounded-2xl">
              <AvatarFallback className="rounded-2xl text-base sm:text-lg font-black text-primary bg-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground truncate">
            {repName}
          </h3>
          <p className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary mt-0.5 truncate">
            <BriefcaseIcon className="size-3.5 shrink-0" />
            <span className="truncate">{repTitle}</span>
          </p>
          {repNotes && (
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-tight">
              {repNotes}
            </p>
          )}
        </div>
      </div>

      {/* Contact Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-3.5">
        {/* Phone */}
        <a
          href={`tel:${cleanPhoneForCall}`}
          className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/60 p-2.5 sm:p-3 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <PhoneIcon className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Doğrudan Arama
            </span>
            <span className="block text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {repPhone}
            </span>
          </div>
        </a>

        {/* Email */}
        <a
          href={`mailto:${repEmail}?subject=Lisans%20Yenileme%20Talebi`}
          className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/60 p-2.5 sm:p-3 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
          <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <MailIcon className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              E-Posta
            </span>
            <span className="block text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
              {repEmail}
            </span>
          </div>
        </a>
      </div>

      {/* Call to Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        {/* WhatsApp Direct Chat */}
        {cleanWhatsappNumber && (
          <Button
            className="w-full sm:flex-1 h-11 sm:h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#25D366]/20 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            render={
              <a
                href={`https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
                  `Merhaba ${repName}, işletmemizin lisans yenileme ve paket uzatma işlemleri hakkında görüşmek istiyorum.`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <MessageSquareIcon className="size-4 mr-1.5 shrink-0" />
            <span className="truncate">WhatsApp ile İletişim</span>
          </Button>
        )}

        {/* Call Button */}
        <Button
          variant="outline"
          className="w-full sm:w-auto h-11 sm:h-12 px-5 rounded-xl border-primary/30 hover:bg-primary/10 text-primary font-bold text-xs sm:text-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
          render={<a href={`tel:${cleanPhoneForCall}`} />}
        >
          <PhoneCallIcon className="size-4 mr-1.5 shrink-0" />
          <span>Hemen Ara</span>
        </Button>
      </div>
    </div>
  );
}
