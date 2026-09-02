"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldAlertIcon,
  QrCodeIcon,
  UsersIcon,
  RadioIcon,
  SparklesIcon,
  ArrowRightIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EmptyTableDTO } from "@/services/guest-order.service";

export interface TableOccupiedViewProps {
  readonly restaurantName: string;
  readonly logoUrl: string | null;
  readonly tableLabel: string;
  readonly username: string;
  readonly primaryColor: string;
  readonly emptyTables: readonly EmptyTableDTO[];
}

export function TableOccupiedView({
  restaurantName,
  logoUrl,
  tableLabel,
  username,
  primaryColor,
  emptyTables,
}: TableOccupiedViewProps) {
  const [selectedTable, setSelectedTable] = useState<EmptyTableDTO | null>(null);

  return (
    <div className="min-h-svh w-full bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-foreground flex flex-col items-center justify-between p-4 pb-12 sm:p-6">
      {/* 1. Header / Restaurant Branding */}
      <div className="w-full max-w-md flex items-center justify-center gap-3 pt-4">
        {logoUrl ? (
          <div className="relative size-12 rounded-2xl overflow-hidden shadow-md border border-zinc-200/80 shrink-0">
            <Image
              src={logoUrl}
              alt={restaurantName}
              fill
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="text-center">
          <h1 className="font-black text-lg text-zinc-900 dark:text-white tracking-tight">
            {restaurantName}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Müşteri Sipariş Sistemi
          </p>
        </div>
      </div>

      {/* 2. Fullscreen Alert Card */}
      <div className="w-full max-w-md my-auto py-6 space-y-5">
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl p-6 border-2 border-red-500/80 shadow-2xl shadow-red-500/10 text-center space-y-4">
          <div className="mx-auto size-20 rounded-3xl bg-red-500/10 text-red-600 flex items-center justify-center ring-8 ring-red-500/5 animate-pulse">
            <ShieldAlertIcon className="size-10 stroke-[2.2]" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-black uppercase tracking-wider">
              Masa Kilitli 🔒
            </span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
              {tableLabel} Şu Anda Aktif Kullanımda
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bu masa başka bir misafirimiz veya cihaz tarafından aktif olarak
              kullanılmaktadır. Sipariş güvenliği için masaya farklı bir cihazdan
              giriş yapılamaz.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <span>ℹ️</span>
            <span>
              Lütfen restoranımızdaki boş masalardan birine geçerek masadaki QR
              kodu okutunuz.
            </span>
          </div>
        </div>

        {/* 3. Available / Empty Tables Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <SparklesIcon className="size-3.5 text-emerald-500" />
              <span>Boş Masalar ({emptyTables.length})</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Hemen Geçebilirsiniz
            </span>
          </div>

          {emptyTables.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed text-center text-sm text-muted-foreground bg-card">
              Şu anda müsait boş masa bulunmamaktadır. Lütfen garsonunuza danışınız.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
              {emptyTables.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-card hover:border-emerald-500 hover:bg-emerald-50/20 transition-all duration-200 cursor-pointer shadow-xs group"
                >
                  <div className="min-w-0">
                    <p className="font-black text-sm text-foreground truncate group-hover:text-emerald-600 transition-colors">
                      {t.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {t.section ? <span>{t.section}</span> : null}
                      {t.seats ? (
                        <span className="flex items-center gap-0.5">
                          <UsersIcon className="size-3" />
                          {t.seats} Kişilik
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-[11px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                    <span>Geç</span>
                    <ArrowRightIcon className="size-3" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal: QR / NFC Scan Prompt for Selected Empty Table */}
      <Dialog
        open={Boolean(selectedTable)}
        onOpenChange={(open) => !open && setSelectedTable(null)}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-2 shadow-2xl">
          <DialogHeader className="p-5 pb-2 text-center">
            <div className="mx-auto size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
              <QrCodeIcon className="size-8" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight">
              {selectedTable?.label} Masası Doğrulama
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 pt-0 space-y-4 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lütfen <strong className="text-foreground">{selectedTable?.label}</strong> masasına
              geçiniz ve masa üzerindeki QR kodu okutunuz veya NFC alanına
              dokundurunuz.
            </p>

            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-around">
              <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted-foreground">
                <span className="p-2.5 rounded-xl bg-white dark:bg-zinc-700 shadow-2xs">
                  <QrCodeIcon className="size-6 text-foreground" />
                </span>
                <span>QR Kod Okut</span>
              </div>
              <div className="text-muted-foreground font-black text-xs">VEYA</div>
              <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted-foreground">
                <span className="p-2.5 rounded-xl bg-white dark:bg-zinc-700 shadow-2xs">
                  <RadioIcon className="size-6 text-foreground" />
                </span>
                <span>NFC Dokundur</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {selectedTable ? (
                <Link
                  href={`/order/${username}?table=${selectedTable.id}`}
                  className="w-full h-12 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <QrCodeIcon className="size-4" />
                  <span>{selectedTable.label} Masasına Geçiş Yap</span>
                </Link>
              ) : null}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTable(null)}
                className="w-full text-xs font-medium text-muted-foreground"
              >
                Vazgeç
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
