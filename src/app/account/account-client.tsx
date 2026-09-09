"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SparkleIcon,
  DownloadIcon,
  ShieldCheckIcon,
  HeadphonesIcon,
  CheckCircleIcon,
  LogoutIcon,
  PlusIcon,
  XIcon,
} from "@/components/ui/icons";

export function AccountClientSections() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [manualCredit, setManualCredit] = useState(5000);

  const handleLogoutConfirm = async () => {
    try {
      // Çerez oturumunu sonlandır
      await fetch("/api/mobile/auth/logout", { method: "POST" }).catch(() => null);
    } finally {
      // Oturumu kapatıp login sayfasına yönlendir
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* 3. Oxonom AI Kredilerim Kartı (Görsel 2 Üst Bölüm) */}
      <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/30">
              <SparkleIcon size={18} weight="fill" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Oxonom AI Kredilerim
              </h3>
              <p className="text-[11px] font-medium text-slate-500">
                Aylık kota ve akıllı servisler
              </p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
            %48.5 Kalan
          </span>
        </div>

        {/* Kredi Sayacı & Bar */}
        <div className="rounded-2xl bg-slate-50/70 p-3.5 border border-slate-100">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-slate-900">4.850</span>
              <span className="text-xs font-semibold text-slate-400"> / 10.000 Kredi</span>
            </div>
            <span className="text-[11px] font-bold text-indigo-600">
              1 Kasım&apos;da +5.000
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: "48.5%" }}
            />
          </div>

          {/* Harcama Özeti 3 Sütun */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3 text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold truncate">Görsel İyileştir...</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">3.150 used</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold truncate">Besin & Çeviri</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">1.200 used</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-semibold truncate">Satış Tahmini</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">800 used</div>
            </div>
          </div>
        </div>

        {/* Kredi Geçmişi Butonu */}
        <button
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Kredi Geçmişi
        </button>

        {/* Mock Veri Uyarısı */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
          <span>⚠️</span>
          <span>Bu alandaki AI kredi bilgileri şimdilik mock veridir.</span>
        </div>
      </section>

      {/* 4. Hızlı Ek Kredi Yükle & Manuel Kredi Kartı */}
      <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            HIZLI EK KREDİ YÜKLE
          </h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <CheckCircleIcon size={14} weight="fill" />
            <span>Anında Tanımlanır</span>
          </div>
        </div>

        {/* Hazır Paket Kartları */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50/50 hover:border-indigo-300 transition cursor-pointer">
            <div className="text-xs font-black text-indigo-700">+2.500 Kredi</div>
            <div className="text-base font-black text-slate-900 mt-1">₺249</div>
            <div className="text-[10px] text-slate-400 font-semibold">Tek Seferlik</div>
          </div>

          <div className="relative rounded-2xl border border-indigo-200 p-3 bg-indigo-50/30 hover:border-indigo-400 transition cursor-pointer">
            <span className="absolute right-2 top-2 rounded bg-indigo-600 px-1.5 py-0.5 text-[8px] font-extrabold text-white uppercase">
              POPÜLER
            </span>
            <div className="text-xs font-black text-indigo-700">+10.000 Kredi</div>
            <div className="text-base font-black text-slate-900 mt-1">₺699</div>
            <div className="text-[10px] text-emerald-600 font-bold">%30 Avantajlı</div>
          </div>
        </div>

        {/* Manuel Kredi Yükleme Alanı */}
        <div className="rounded-2xl bg-slate-50/80 p-3.5 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Manuel Kredi Belirle:</span>
            <span className="text-indigo-600 font-black">{manualCredit.toLocaleString("tr-TR")} Kredi</span>
          </div>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={manualCredit}
            onChange={(e) => setManualCredit(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-slate-900">
              Tutar: ₺{Math.round(manualCredit * 0.08).toLocaleString("tr-TR")}
            </span>
            <button
              type="button"
              className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              Kredi Satın Al
            </button>
          </div>
        </div>

        {/* Mock Veri Uyarısı */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
          <span>⚠️</span>
          <span>Bu alandaki kredi satın alma paketleri şimdilik mock veridir.</span>
        </div>
      </section>

      {/* 5. Faturalar & E-Arşiv Alanı (Görsel 3 Birebir) */}
      <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Faturalar & E-Arşiv
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Son kesilen kurumsal faturalar
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            Tümünü Gör (12)
          </button>
        </div>

        {/* Vergi Dairesi Başlığı */}
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/50 p-3 border border-indigo-100/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
            🏢
          </div>
          <div>
            <div className="text-xs font-black text-slate-900">
              Bilgin Restoran Hizmetleri A.Ş.
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              VKN: 1849204812 • Beyoğlu Vergi Dairesi
            </div>
          </div>
        </div>

        {/* Fatura Kalemleri */}
        <div className="space-y-2 pt-1">
          {/* Fatura 1: Ekim 2024 */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm text-base">
                🧾
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Ekim 2024</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                    Ödendi
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  01.10.2024 • ₺3.250,00
                </div>
              </div>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm hover:bg-indigo-50"
              title="Faturayı İndir"
            >
              <DownloadIcon size={16} weight="bold" />
            </button>
          </div>

          {/* Fatura 2: Eylül 2024 */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm text-base">
                🧾
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Eylül 2024</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                    Ödendi
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  01.09.2024 • ₺3.499,00 (Ek Donanım)
                </div>
              </div>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm hover:bg-indigo-50"
              title="Faturayı İndir"
            >
              <DownloadIcon size={16} weight="bold" />
            </button>
          </div>

          {/* Fatura 3: Ağustos 2024 */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm text-base">
                🧾
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">Ağustos 2024</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                    Ödendi
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  01.08.2024 • ₺3.250,00
                </div>
              </div>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm hover:bg-indigo-50"
              title="Faturayı İndir"
            >
              <DownloadIcon size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Mock Veri Uyarısı */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 pt-1">
          <span>⚠️</span>
          <span>Bu alandaki faturalar ve e-arşiv verileri şimdilik mock veridir.</span>
        </div>
      </section>

      {/* 6. Güvenlik ve Destek Alanı */}
      <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          GÜVENLİK VE DESTEK
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon size={18} className="text-emerald-600" weight="fill" />
              <span className="font-bold text-slate-800">2FA İki Aşamalı Güvenlik</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">Aktif</span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-2.5">
              <HeadphonesIcon size={18} className="text-indigo-600" weight="fill" />
              <span className="font-bold text-slate-800">Doğrudan Müşteri Temsilcisi</span>
            </div>
            <span className="text-[11px] font-bold text-indigo-600">0850 309 9901</span>
          </div>
        </div>

        {/* Mock Veri Uyarısı */}
        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
          <span>⚠️</span>
          <span>Bu alandaki güvenlik ve destek bilgileri şimdilik mock veridir.</span>
        </div>
      </section>

      {/* 7. Oturumu Kapat Butonu */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-xs font-black shadow-sm transition hover:bg-rose-100 active:scale-95"
        >
          <LogoutIcon size={16} weight="bold" />
          <span>Oturumu Kapat</span>
        </button>
      </div>

      {/* Oturumu Kapat Onay Modalı */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Oturumu Kapat
              </h3>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="py-4 text-xs font-medium text-slate-600 leading-relaxed">
              Oturumunuzu kapatmak istediğinizden emin misiniz? Tekrar giriş yapmak için cep numaranız ve SMS / OTP doğrulama ekranına yönlendirileceksiniz.
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition"
              >
                Evet, Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
