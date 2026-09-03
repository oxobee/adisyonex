"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  Edit2Icon,
  KeyRoundIcon,
  Loader2Icon,
  MessageSquareCodeIcon,
  PhoneIcon,
  RotateCwIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { requestOtpAction, verifyOtpAction } from "@/actions/auth.actions";
import { startLoginAction, verifyPinAction } from "@/actions/pin.actions";
import { PhoneInput } from "@/components/phone-input";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import { phoneSchema } from "@/lib/validators/shared";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OTP_USER_NOT_FOUND:
    "Bu telefon numarası sistemde kayıtlı değil. Lütfen yöneticinizle iletişime geçin.",
  PIN_INVALID: "Hatalı PIN kodu girdiniz. Lütfen tekrar deneyin.",
  PIN_LOCKED: "Çok fazla başarısız deneme. Giriş yapmak için tek kullanımlık kod gönderildi.",
};

const toAuthMessage = (raw: string) => AUTH_ERROR_MESSAGES[raw] ?? raw;

type Step = "phone" | "pin" | "code";

export function LoginForm({
  className,
  systemName = "AdisyonEx",
  logoUrl = null,
  systemTagline = "Gelişmiş Restoran & QR Menü Yönetim Sistemi",
  ...props
}: React.ComponentProps<"div"> & {
  readonly systemName?: string;
  readonly logoUrl?: string | null;
  readonly systemTagline?: string | null;
}) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Geri sayım sayacı (SMS yeniden gönderim için)
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const start = useServerAction(startLoginAction, {
    onSuccess: (data) => {
      setError(null);
      const nextStep = data?.method === "pin" ? "pin" : "code";
      setStep(nextStep);
      if (nextStep === "code") {
        setCountdown(60);
      }
    },
    onError: (message) => setError(toAuthMessage(message)),
  });

  const sendCode = useServerAction(requestOtpAction, {
    onSuccess: () => {
      setError(null);
      setPin("");
      setStep("code");
      setCountdown(60);
    },
    onError: (message) => setError(toAuthMessage(message)),
  });

  const verifyPin = useServerAction(verifyPinAction, {
    redirectTo: "/dashboard/home",
    onError: (message) => {
      setError(toAuthMessage(message));
      if (message === "PIN_LOCKED") {
        sendCode.execute({ phone });
      }
    },
  });

  const verify = useServerAction(verifyOtpAction, {
    redirectTo: "/dashboard/home",
    onError: (message) => setError(toAuthMessage(message)),
  });

  const handlePhoneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError("Lütfen geçerli bir telefon numarası girin.");
      return;
    }
    setError(null);
    start.execute({ phone });
  };

  const handlePinSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      setError("Lütfen 4–6 haneli PIN kodunuzu girin.");
      return;
    }
    setError(null);
    verifyPin.execute({ phone, pin });
  };

  const handleCodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Lütfen 6 haneli doğrulama kodunu eksiksiz girin.");
      return;
    }
    setError(null);
    verify.execute({ phone, code });
  };

  const changeNumber = () => {
    setPin("");
    setCode("");
    setError(null);
    setStep("phone");
  };

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm transition-all duration-200 select-none",
        className,
      )}
      {...props}
    >
      {/* 
        ========================================================================
        UNTITLED UI HEADER (LOGO, BAŞLIK & ALT BAŞLIK)
        ========================================================================
      */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        {logoUrl ? (
          <div className="relative flex h-12 sm:h-14 w-auto max-w-[220px] items-center justify-center mb-3">
            <Image
              src={logoUrl}
              alt={systemName}
              width={180}
              height={56}
              className="h-12 sm:h-14 w-auto object-contain"
              priority
            />
          </div>
        ) : (
          <div className="flex size-13 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-3 shadow-xs">
            <ShieldCheckIcon className="size-7" />
          </div>
        )}

        <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-gray-900">
          {systemName}&apos;e Giriş Yapın
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 leading-relaxed max-w-xs">
          {systemTagline || "Gelişmiş Restoran & QR Menü Yönetim Sistemi"}
        </p>
      </div>

      {/* 
        ========================================================================
        HATA BİLDİRİMİ (UNTITLED UI ALERT)
        ========================================================================
      */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in duration-150">
          <AlertCircleIcon className="size-4.5 shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* 
        ========================================================================
        ADIM 1: TELEFON NUMARASI GİRİŞİ (PHONE INPUT STEP)
        ========================================================================
      */}
      {step === "phone" && (
        <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
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
              disabled={start.isPending}
            />

            <span className="text-xs text-gray-500 font-normal mt-0.5">
              Giriş yapmak için tek kullanımlık bir SMS doğrulama kodu alacaksınız.
            </span>
          </div>

          <button
            type="submit"
            disabled={start.isPending}
            className="flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer select-none mt-2"
          >
            {start.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                <span>Kontrol ediliyor…</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>Devam Et</span>
                <ArrowRightIcon className="size-4" />
              </span>
            )}
          </button>
        </form>
      )}

      {/* 
        ========================================================================
        ADIM 2: DOĞRULAMA KODU (OTP VERIFICATION STEP - KULLANICI GÖRSELİNDEKİ EKRAN)
        ========================================================================
      */}
      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="flex flex-col gap-4">
          {/* Telefon Numarası Bilgi Rozeti */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 min-w-0">
              <PhoneIcon className="size-3.5 text-gray-500 shrink-0" />
              <span className="text-xs font-semibold text-gray-700 truncate">
                <span className="font-bold text-gray-900">{phone}</span> numarasına gönderildi.
              </span>
            </div>

            <button
              type="button"
              onClick={changeNumber}
              className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Edit2Icon className="size-3" />
              <span>Değiştir</span>
            </button>
          </div>

          {/* Doğrulama Kodu Input Alanı */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-semibold text-gray-700 flex items-center justify-between">
              <span>Doğrulama Kodu</span>
              <span className="text-xs font-medium text-gray-500">6 Haneli Kod</span>
            </label>

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
                "h-13 w-full rounded-xl border border-gray-300 bg-white px-4 text-center font-mono text-2xl font-bold tracking-[0.4em] text-gray-900 shadow-xs",
                "placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-base",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all",
                error && "border-rose-500 ring-2 ring-rose-500/20",
              )}
            />
          </div>

          {/* Aksiyon Butonu */}
          <button
            type="submit"
            disabled={verify.isPending}
            className="flex items-center justify-center gap-2 h-12 w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm sm:text-base shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer select-none mt-1"
          >
            {verify.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                <span>Doğrulanıyor…</span>
              </span>
            ) : (
              <span>Doğrula ve Devam Et</span>
            )}
          </button>

          {/* Yeniden Gönder Linki & Sayaç */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mt-2 text-center">
            <span>Kod gelmedi mi?</span>
            {countdown > 0 ? (
              <span className="text-gray-400 font-semibold tabular-nums">
                ({countdown}s sonra tekrar gönder)
              </span>
            ) : (
              <button
                type="button"
                disabled={sendCode.isPending}
                onClick={() => sendCode.execute({ phone })}
                className="font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                {sendCode.isPending ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <RotateCwIcon className="size-3" />
                )}
                <span>Kodu tekrar gönder</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* 
        ========================================================================
        ADIM 3: PIN KODU İLE GİRİŞ (PIN STEP)
        ========================================================================
      */}
      {step === "pin" && (
        <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-xs font-semibold text-gray-700 truncate">
              <span className="font-bold text-gray-900">{phone}</span> olarak giriş yapılıyor.
            </span>
            <button
              type="button"
              onClick={changeNumber}
              className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer"
            >
              Numarayı değiştir
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="pin" className="text-sm font-semibold text-gray-700">
              Yönetici PIN Kodu
            </label>

            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              placeholder="••••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (error) setError(null);
              }}
              autoFocus
              className={cn(
                "h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-center font-mono text-2xl font-bold tracking-[0.3em] text-gray-900 shadow-xs",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all",
                error && "border-rose-500 ring-2 ring-rose-500/20",
              )}
            />
          </div>

          <button
            type="submit"
            disabled={verifyPin.isPending}
            className="flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer select-none mt-1"
          >
            {verifyPin.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                <span>Giriş Yapılıyor…</span>
              </span>
            ) : (
              <span>Giriş Yap</span>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 text-center mt-2">
            <span>PIN kodunuzu mu unuttunuz?</span>
            <button
              type="button"
              disabled={sendCode.isPending}
              onClick={() => sendCode.execute({ phone })}
              className="font-bold text-primary hover:underline cursor-pointer"
            >
              SMS kodu ile giriş yapın
            </button>
          </div>
        </form>
      )}

      {/* 
        ========================================================================
        UNTITLED UI FOOTER
        ========================================================================
      */}
      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          Devam ederek{" "}
          <Link href="#" className="font-semibold text-gray-700 hover:underline">
            Kullanım Şartları
          </Link>{" "}
          ve{" "}
          <Link href="#" className="font-semibold text-gray-700 hover:underline">
            Gizlilik Politikası
          </Link>
          &apos;nı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
