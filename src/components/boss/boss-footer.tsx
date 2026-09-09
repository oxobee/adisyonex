"use client";

import Link from "next/link";
import {
  CrownIcon,
  ShieldCheckIcon,
  WifiIcon,
  SparkleIcon,
  HomeIcon,
} from "@/components/ui/icons";

export function BossFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-slate-950/80 py-10 text-xs text-slate-400 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8">
        {/* Sol Logo & Bilgi */}
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <CrownIcon size={14} weight="fill" />
            </div>
            <span className="font-bold text-white tracking-wider">OXONOM BOSS</span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">
              v2.4 Pro
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Adisyonex Bulut Restoran & POS Yönetim Altyapısı
          </p>
        </div>

        {/* Orta: Hızlı Menü Bağlantıları */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
          <Link href="/boss" className="hover:text-amber-400 transition">
            Patron Paneli
          </Link>
          <Link href="/pos" className="hover:text-amber-400 transition">
            Kasa / POS
          </Link>
          <Link href="/tables" className="hover:text-amber-400 transition">
            Masa Planı
          </Link>
          <Link href="/dashboard" className="hover:text-amber-400 transition">
            Genel Dashboard
          </Link>
        </div>

        {/* Sağ: Güvenlik & Telif */}
        <div className="flex flex-col items-center sm:items-end gap-1.5">
          <div className="flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheckIcon size={14} weight="fill" />
            <span>256-Bit Uçtan Uca Şifreli Veri</span>
          </div>
          <p className="text-[10px] text-slate-400">
            © {currentYear} Oxonom POS Technologies. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
