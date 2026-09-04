"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  CheckCircle2Icon,
  DeleteIcon,
  LockIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  UtensilsCrossedIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export function HomeScreenLockModal({
  isLocked,
  onUnlock,
  correctPin = "0000",
  restaurantName = "Adisyon",
  logoUrl = null,
}: {
  readonly isLocked: boolean;
  readonly onUnlock: () => void;
  readonly correctPin?: string;
  readonly restaurantName?: string;
  readonly logoUrl?: string | null;
}) {
  const [pin, setPin] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyPin = useCallback(
    (pinToTest: string) => {
      if (pinToTest === correctPin) {
        setIsSuccess(true);
        setErrorMessage(null);
        setTimeout(() => {
          setIsSuccess(false);
          setPin("");
          onUnlock();
        }, 400);
      } else {
        setIsShaking(true);
        setErrorMessage("Hatalı PIN kodu! Lütfen tekrar deneyin.");
        setTimeout(() => {
          setIsShaking(false);
          setPin("");
          setErrorMessage(null);
        }, 750);
      }
    },
    [correctPin, onUnlock]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (isSuccess || isShaking || pin.length >= 4) return;
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    },
    [isSuccess, isShaking, pin, verifyPin]
  );

  const handleBackspace = useCallback(() => {
    if (isSuccess || isShaking) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  }, [isSuccess, isShaking]);

  const handleClear = useCallback(() => {
    if (isSuccess || isShaking) return;
    setPin("");
    setErrorMessage(null);
  }, [isSuccess, isShaking]);

  // Physical keyboard support
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "Delete") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, handleDigit, handleBackspace, handleClear]);

  if (!isLocked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-state="open"
      className="esc-modal-open fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xl select-none"
    >
      <style jsx global>{`
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-12px); }
          40% { transform: translateX(12px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .anim-lock-shake {
          animation: lockShake 0.45s ease-in-out both;
        }
        @keyframes pinBounce {
          0% { transform: scale(0.6); opacity: 0.2; }
          60% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .anim-pin-fill {
          animation: pinBounce 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      <div
        className={cn(
          "relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 flex flex-col items-center text-center transition-all",
          isShaking && "anim-lock-shake border-rose-300 shadow-rose-500/20"
        )}
      >
        {/* LOGO & RESTAURANT */}
        <div className="flex items-center gap-2 mb-2">
          {logoUrl ? (
            <div className="relative h-9 w-32">
              <Image src={logoUrl} alt={restaurantName} fill className="object-contain" priority />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <UtensilsCrossedIcon className="size-4" />
              </div>
              <span className="text-base font-black text-gray-900 tracking-tight">
                {restaurantName}
              </span>
            </div>
          )}
        </div>

        {/* LOCK BADGE & TITLE */}
        <div className="my-2 flex flex-col items-center">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 mb-3",
              isSuccess
                ? "bg-emerald-50 text-emerald-600 scale-110"
                : isShaking
                ? "bg-rose-50 text-rose-600 scale-105"
                : "bg-blue-50 text-blue-600"
            )}
          >
            {isSuccess ? (
              <CheckCircle2Icon className="size-8 animate-in zoom-in-50" />
            ) : isShaking ? (
              <ShieldAlertIcon className="size-8" />
            ) : (
              <LockIcon className="size-7" />
            )}
          </div>

          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {isSuccess ? "Kilit Açıldı" : "Ekran Kilitli"}
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            {isSuccess
              ? "Hoş geldiniz, yönlendiriliyorsunuz…"
              : "Devam etmek için 4 haneli PIN kodunuzu tuşlayın"}
          </p>
        </div>

        {/* 4-DIGIT PIN DOTS */}
        <div className="flex items-center justify-center gap-3.5 my-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={cn(
                  "size-4.5 rounded-full border-2 transition-all flex items-center justify-center",
                  isSuccess
                    ? "border-emerald-500 bg-emerald-500"
                    : isShaking
                    ? "border-rose-500 bg-rose-500"
                    : isFilled
                    ? "border-blue-600 bg-blue-600 shadow-xs shadow-blue-500/30"
                    : "border-gray-300 bg-gray-50"
                )}
              >
                {isFilled && <div className="size-2 rounded-full bg-white anim-pin-fill" />}
              </div>
            );
          })}
        </div>

        {/* ERROR / FEEDBACK MESSAGE */}
        <div className="min-h-[22px] flex items-center justify-center mb-2">
          {errorMessage ? (
            <span className="text-xs font-bold text-rose-600 animate-in fade-in">
              {errorMessage}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-gray-400">
              Klavye veya numpad kullanabilirsiniz
            </span>
          )}
        </div>

        {/* 3X4 NUMPAD */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[280px] mt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="flex items-center justify-center h-14 rounded-2xl bg-gray-50 hover:bg-gray-100/90 active:bg-gray-200 border border-gray-200/80 text-xl font-black text-gray-800 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              {digit}
            </button>
          ))}

          {/* CLEAR (C) */}
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center justify-center h-14 rounded-2xl bg-rose-50/50 hover:bg-rose-100/80 active:bg-rose-200/80 border border-rose-200/60 text-xs font-black text-rose-600 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Tümünü Sil"
          >
            <RotateCcwIcon className="size-4" />
          </button>

          {/* 0 */}
          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="flex items-center justify-center h-14 rounded-2xl bg-gray-50 hover:bg-gray-100/90 active:bg-gray-200 border border-gray-200/80 text-xl font-black text-gray-800 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            0
          </button>

          {/* BACKSPACE */}
          <button
            type="button"
            onClick={handleBackspace}
            className="flex items-center justify-center h-14 rounded-2xl bg-gray-50 hover:bg-gray-100/90 active:bg-gray-200 border border-gray-200/80 text-gray-600 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Sil"
          >
            <DeleteIcon className="size-5" />
          </button>
        </div>

        {/* FOOTER HINT */}
        <div className="mt-5 text-[11px] font-medium text-gray-400">
          PIN kodunu Sistem Ayarları &gt; Giriş ve Güvenlik alanından değiştirebilirsiniz.
        </div>
      </div>
    </div>
  );
}
