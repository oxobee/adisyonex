"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheckIcon,
  ArrowRightIcon,
  RefreshIcon,
  PhoneIcon,
  WarningIcon,
} from "@/components/ui/icons";
import { requestOtpAction, verifyOtpAction } from "@/actions/auth.actions";
import { PhoneInput } from "@/components/phone-input";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import { phoneSchema } from "@/lib/validators/shared";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OTP_USER_NOT_FOUND:
    "Bu telefon numarası sistemde kayıtlı değil. Lütfen yöneticinizle iletişime geçin.",
  OTP_INVALID: "Doğrulama kodu geçersiz. Lütfen tekrar deneyin.",
  OTP_EXPIRED: "Doğrulama kodunun süresi dolmuş. Lütfen yeni kod isteyin.",
};

const toAuthMessage = (raw: string) => AUTH_ERROR_MESSAGES[raw] ?? raw;

interface MloginClientProps {
  systemName?: string;
  logoUrl?: string | null;
  systemTagline?: string | null;
}

export function MloginClient({
  systemName = "Oxonom POS",
  logoUrl = null,
  systemTagline = "Yönetici & Patron Mobil Paneli",
}: MloginClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCode = useServerAction(requestOtpAction, {
    onSuccess: () => {
      setError(null);
      setStep("code");
      setCountdown(60);
    },
    onError: (msg) => setError(toAuthMessage(msg)),
  });

  const verify = useServerAction(verifyOtpAction, {
    redirectTo: "/boss",
    onSuccess: () => {
      // Doğrudan boss ekranına yönlendir
      window.location.href = "/boss";
    },
    onError: (msg) => setError(toAuthMessage(msg)),
  });

  const handlePhoneSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError("Lütfen geçerli bir telefon numarası girin.");
      return;
    }
    setError(null);
    sendCode.execute({ phone });
  };

  const handleCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(code)) {
      setError("Lütfen geçerli bir doğrulama kodu girin.");
      return;
    }
    setError(null);
    verify.execute({ phone, code });
  };

  const changeNumber = () => {
    setCode("");
    setError(null);
    setStep("phone");
  };

  return (
    <div className="w-full rounded-3xl border border-slate-100/15 bg-white p-6 sm:p-7 shadow-2xl transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        {logoUrl ? (
          <div className="relative flex h-12 w-auto max-w-[200px] items-center justify-center mb-3">
            <Image
              src={logoUrl}
              alt={systemName}
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        ) : (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-3 shadow-sm">
            <ShieldCheckIcon size={30} weight="duotone" />
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          <span>👑 Patron Girişi</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          {systemName} Mobil Giriş
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-xs">
          {systemTagline}
        </p>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in duration-150">
          <WarningIcon size={16} className="shrink-0 text-rose-600 mt-0.5" weight="fill" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Adım 1: Telefon Girişi */}
      {step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-xs font-bold text-slate-700">
              Telefon Numarası
            </label>

            <PhoneInput
              id="phone"
              defaultCountry="TR"
              onChange={(value) => {
                setPhone(value);
                if (error) setError(null);
              }}
              invalid={Boolean(error)}
              disabled={sendCode.isPending}
            />

            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              Giriş yapmak için tek kullanımlık bir SMS doğrulama kodu alacaksınız.
            </span>
          </div>

          <button
            type="submit"
            disabled={sendCode.isPending}
            className="flex items-center justify-center gap-2 h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 mt-1"
          >
            {sendCode.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Kod Gönderiliyor…</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>Devam Et</span>
                <ArrowRightIcon size={16} weight="bold" />
              </span>
            )}
          </button>
        </form>
      )}

      {/* Adım 2: OTP Doğrulama Kodu */}
      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
          {/* Telefon Numarası Bilgi Rozeti */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <PhoneIcon size={15} className="text-slate-500 shrink-0" weight="duotone" />
              <span className="text-xs font-semibold text-slate-700 truncate">
                <span className="font-bold text-slate-900">{phone}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={changeNumber}
              className="text-xs font-bold text-indigo-600 hover:underline shrink-0 cursor-pointer"
            >
              Değiştir
            </button>
          </div>

          {/* Kod Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="code" className="text-xs font-bold text-slate-700">
                SMS Doğrulama Kodu
              </label>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                OTP
              </span>
            </div>

            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (error) setError(null);
              }}
              autoFocus
              className={cn(
                "h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-center font-mono text-2xl font-black tracking-[0.35em] text-slate-900 shadow-inner",
                "placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-sm",
                "focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 focus:outline-none transition-all",
                error && "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20",
              )}
            />
          </div>

          {/* Onay Butonu */}
          <button
            type="submit"
            disabled={verify.isPending}
            className="flex items-center justify-center gap-2 h-12 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 mt-1"
          >
            {verify.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Giriş Yapılıyor…</span>
              </span>
            ) : (
              <span>Doğrula ve Boss Ekranına Geç</span>
            )}
          </button>

          {/* Yeniden Kod Gönder */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1 text-center">
            <span>Kod almadınız mı?</span>
            {countdown > 0 ? (
              <span className="text-slate-400 font-semibold tabular-nums">
                ({countdown}s)
              </span>
            ) : (
              <button
                type="button"
                disabled={sendCode.isPending}
                onClick={() => sendCode.execute({ phone })}
                className="font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshIcon size={12} weight="bold" />
                <span>Tekrar Gönder</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
