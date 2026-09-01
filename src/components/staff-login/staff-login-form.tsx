"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DeleteIcon, UtensilsCrossedIcon } from "lucide-react";
import { toast } from "sonner";

import { staffLoginAction } from "@/actions/staff-auth.actions";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import type { StaffLoginOption } from "@/services/staff-auth.service";

const AUTH_ERRORS: Record<string, string> = {
  STAFF_LOGIN_INVALID: "Hatalı PIN kodu.",
  STAFF_LOGIN_LOCKED: "Çok fazla hatalı deneme. Lütfen bir dakika bekleyin.",
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const ROLE_LABEL: Record<string, string> = {
  WAITER: "Garson / Servis",
  KITCHEN: "Mutfak / Aşçı",
  ADMIN: "Yönetici",
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const PIN_LENGTH = 4;

function Avatar({
  name,
  photoUrl,
  className,
}: {
  readonly name: string;
  readonly photoUrl: string | null;
  readonly className: string;
}) {
  return (
    <span
      className={`ring-border bg-muted flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-1 ${className}`}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt=""
          width={64}
          height={64}
          className="size-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function StaffLoginForm({
  username,
  restaurantName,
  logoUrl,
  staff,
}: {
  readonly username: string;
  readonly restaurantName: string;
  readonly logoUrl: string | null;
  readonly staff: readonly StaffLoginOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<StaffLoginOption | null>(null);
  const [pin, setPin] = useState("");
  const [shakeError, setShakeError] = useState(false);
  const submitRef = useRef(false);

  const login = useServerAction(staffLoginAction, {
    onSuccess: (result) => {
      router.push(result?.redirectUrl || `/dashboard/orders`);
      router.refresh();
    },
    onError: (message) => {
      // Shake animation on error
      setShakeError(true);
      setTimeout(() => setShakeError(false), 600);
      setPin("");
      const errMsg = AUTH_ERRORS[message] ?? message;
      toast.error(errMsg, { duration: 3000 });
    },
  });

  const triggerSubmit = useCallback(
    (currentPin: string) => {
      if (!selected || currentPin.length !== PIN_LENGTH || submitRef.current) return;
      submitRef.current = true;
      login.execute({ username, employeeCode: selected.employeeCode, pin: currentPin });
      setTimeout(() => { submitRef.current = false; }, 1500);
    },
    [selected, username, login],
  );

  const appendDigit = useCallback(
    (digit: string) => {
      if (login.isPending) return;
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) {
          // Auto-submit when 4 digits entered
          setTimeout(() => triggerSubmit(next), 60);
        }
        return next;
      });
    },
    [login.isPending, triggerSubmit],
  );

  const backspace = () => setPin((prev) => prev.slice(0, -1));

  const pick = (option: StaffLoginOption) => {
    setSelected(option);
    setPin("");
  };

  const back = () => {
    setSelected(null);
    setPin("");
  };

  // Step 1 — pick who you are.
  if (!selected) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-md">
            {logoUrl ? (
              <Image src={logoUrl} alt="" width={64} height={64} className="size-full object-cover" />
            ) : (
              <UtensilsCrossedIcon className="text-muted-foreground size-8" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{restaurantName}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Personel Girişi · İsminize dokunun</p>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Giriş yapabilecek personel tanımlanmamış.
            </p>
            <p className="text-xs text-muted-foreground">Lütfen yöneticinize başvurun.</p>
          </div>
        ) : (
          <ul className="flex max-h-[65svh] flex-col gap-2 overflow-y-auto pr-1">
            {staff.map((option) => (
              <li key={option.employeeCode} className="animate-in fade-in slide-in-from-left-2 duration-200">
                <button
                  type="button"
                  onClick={() => pick(option)}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-card p-3.5 text-left shadow-xs hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer"
                >
                  <Avatar name={option.name} photoUrl={option.photoUrl} className="size-12 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-foreground text-sm">
                      {option.name}
                    </span>
                    <span className="text-muted-foreground block text-xs mt-0.5">
                      {ROLE_LABEL[option.role] ?? option.role}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 text-xs font-black transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    Seç
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Step 2 — 4-digit PIN entry (no submit button — auto-submits on 4th digit)
  return (
    <div className="flex w-full max-w-xs flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Selected staff header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar name={selected.name} photoUrl={selected.photoUrl} className="size-18 text-lg" />
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground">{selected.name}</h1>
          <p className="text-muted-foreground text-xs">{ROLE_LABEL[selected.role] ?? selected.role}</p>
          <button
            type="button"
            onClick={back}
            className="mt-1.5 text-xs text-primary/80 hover:text-primary underline underline-offset-2 transition-colors cursor-pointer"
          >
            Siz değil misiniz? Geri Dön
          </button>
        </div>
      </div>

      {/* 4-dot PIN indicator */}
      <div
        className={cn(
          "flex flex-col items-center gap-3 transition-all",
          shakeError && "animate-[shake_0.5s_ease-in-out]",
        )}
      >
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
          4 Haneli PIN
        </p>
        <div className="flex items-center gap-4" aria-label="Girilen PIN">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-4 rounded-full transition-all duration-200",
                i < pin.length
                  ? "bg-primary scale-110 shadow-md shadow-primary/30"
                  : "bg-muted-foreground/20 border border-muted-foreground/10",
              )}
            />
          ))}
        </div>

        {login.isPending && (
          <p className="text-xs text-muted-foreground animate-pulse">Giriş yapılıyor…</p>
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

      <p className="text-center text-xs text-muted-foreground">
        4. rakamı girdiğinizde otomatik giriş yapılır
      </p>
    </div>
  );
}
