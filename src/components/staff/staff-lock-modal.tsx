"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { DeleteIcon, LockIcon, LogOutIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { directStaffLogoutAction, staffLoginAction } from "@/actions/staff-auth.actions";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const PIN_LENGTH = 4;

const ROLE_LABELS: Record<string, string> = {
  WAITER: "Garson / Servis",
  KITCHEN: "Mutfak / Aşçı",
  MANAGEMENT: "Yönetici",
  ADMIN: "Yönetici",
  STAFF: "Personel",
};

export function StaffLockModal({
  isOpen,
  onClose,
  staff,
  restaurantUsername,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly staff: {
    readonly name: string;
    readonly role: string;
    readonly employeeCode?: string;
    readonly photoUrl?: string | null;
  };
  readonly restaurantUsername?: string | null;
}) {
  const [pin, setPin] = useState("");
  const [shakeError, setShakeError] = useState(false);
  const isSubmittingRef = useRef(false);

  const login = useServerAction(staffLoginAction, {
    onSuccess: () => {
      setPin("");
      onClose();
      toast.success("Kilit açıldı", { duration: 2000 });
    },
    onError: () => {
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      setPin("");
      toast.error("Hatalı PIN kodu", { duration: 2500 });
    },
  });

  const triggerVerify = useCallback(
    (enteredPin: string) => {
      if (!staff.employeeCode || enteredPin.length !== PIN_LENGTH || isSubmittingRef.current) {
        return;
      }
      isSubmittingRef.current = true;
      login.execute({
        username: restaurantUsername || "",
        employeeCode: staff.employeeCode,
        pin: enteredPin,
      });
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1200);
    },
    [staff.employeeCode, restaurantUsername, login],
  );

  const appendDigit = useCallback(
    (digit: string) => {
      if (login.isPending) return;
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) {
          setTimeout(() => triggerVerify(next), 60);
        }
        return next;
      });
    },
    [login.isPending, triggerVerify],
  );

  const backspace = () => {
    if (login.isPending) return;
    setPin((prev) => prev.slice(0, -1));
  };

  if (!isOpen) {
    return null;
  }

  const initials =
    staff.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen w-screen items-center justify-center bg-background/90 p-4 backdrop-blur-2xl overflow-y-auto animate-in fade-in-0 duration-200">
      <div className="my-auto flex w-full max-w-xs flex-col items-center gap-6 text-center animate-in zoom-in-95 duration-200">
        {/* Lock Icon & Staff Profile */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="size-20 shrink-0 overflow-hidden rounded-3xl border-2 border-primary/40 bg-muted shadow-xl flex items-center justify-center">
              {staff.photoUrl ? (
                <Image
                  src={staff.photoUrl}
                  alt={staff.name}
                  width={80}
                  height={80}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-primary">{initials}</span>
              )}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 flex size-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-2 ring-background">
              <LockIcon className="size-4" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">{staff.name}</h2>
            <p className="text-xs font-semibold text-primary mt-0.5">
              {ROLE_LABELS[staff.role] ?? staff.role}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ekran kilitli · Açmak için PIN girin
            </p>
          </div>
        </div>

        {/* 4-Digit PIN Indicator */}
        <div
          className={cn(
            "flex flex-col items-center gap-2.5 transition-all",
            shakeError && "animate-shake",
          )}
        >
          <div className="flex items-center gap-3.5" aria-label="Girilen PIN">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-4 rounded-full transition-all duration-200",
                  i < pin.length
                    ? "bg-primary scale-110 shadow-md shadow-primary/40"
                    : "bg-muted-foreground/20 border border-muted-foreground/10",
                )}
              />
            ))}
          </div>

          {login.isPending && (
            <p className="text-xs text-primary font-bold animate-pulse">Doğrulanıyor…</p>
          )}
        </div>

        {/* Numpad */}
        <div className="grid w-full grid-cols-3 gap-2.5">
          {KEYS.map((key) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              disabled={login.isPending}
              className="h-16 touch-manipulation rounded-2xl text-2xl font-bold select-none hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 transition-all duration-100 shadow-xs cursor-pointer"
              onClick={() => appendDigit(key)}
            >
              {key}
            </Button>
          ))}
          <div aria-hidden />
          <Button
            type="button"
            variant="outline"
            disabled={login.isPending}
            className="h-16 touch-manipulation rounded-2xl text-2xl font-bold select-none hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 transition-all duration-100 shadow-xs cursor-pointer"
            onClick={() => appendDigit("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-16 touch-manipulation select-none active:scale-95 cursor-pointer"
            onClick={backspace}
            aria-label="Son rakamı sil"
          >
            <DeleteIcon className="size-6" />
          </Button>
        </div>

        {/* Logout / Switch Staff Action */}
        <button
          type="button"
          onClick={async () => {
            await directStaffLogoutAction();
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
        >
          <LogOutIcon className="size-3.5" />
          <span>Farklı Personel ile Giriş Yap / Çıkış</span>
        </button>
      </div>
    </div>
  );
}
