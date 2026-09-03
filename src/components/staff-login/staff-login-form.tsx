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
  WAITER: "Garson",
  KITCHEN: "Mutfak / Aşçı",
  CASHIER: "Kasa",
  MANAGEMENT: "Yönetici",
  OTHER: "Diğer",
  ADMIN: "Yönetici",
  STAFF: "Personel",
};

const ROLE_ICON: Record<string, string> = {
  WAITER: "🍽️",
  KITCHEN: "🍳",
  CASHIER: "💳",
  MANAGEMENT: "👑",
  OTHER: "👤",
  ADMIN: "👑",
  STAFF: "👤",
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
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-muted/40 font-bold shadow-2xs",
        className,
      )}
    >
      <Image
        src={photoUrl || "/default-avatar.png"}
        alt={name}
        width={72}
        height={72}
        className="size-full object-cover"
      />
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
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [pin, setPin] = useState("");
  const [shakeError, setShakeError] = useState(false);
  const submitRef = useRef(false);

  // Group and filter staff
  const categories = [
    { id: "ALL", label: "Tümü", icon: "👥", count: staff.length },
    {
      id: "WAITER",
      label: "Garson",
      icon: "🍽️",
      count: staff.filter((s) => s.role === "WAITER").length,
    },
    {
      id: "KITCHEN",
      label: "Mutfak & Aşçı",
      icon: "🍳",
      count: staff.filter((s) => s.role === "KITCHEN").length,
    },
    {
      id: "CASHIER",
      label: "Kasa",
      icon: "💳",
      count: staff.filter((s) => s.role === "CASHIER").length,
    },
    {
      id: "MANAGEMENT",
      label: "Yönetici",
      icon: "👑",
      count: staff.filter((s) => s.role === "MANAGEMENT").length,
    },
    {
      id: "OTHER",
      label: "Diğer",
      icon: "👤",
      count: staff.filter((s) => s.role === "OTHER").length,
    },
  ].filter((c) => c.id === "ALL" || c.count > 0);

  const filteredStaff = staff.filter((s) => {
    if (selectedCategory !== "ALL" && s.role !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.jobTitle && s.jobTitle.toLowerCase().includes(q)) ||
        (ROLE_LABEL[s.role] && ROLE_LABEL[s.role].toLowerCase().includes(q))
      );
    }
    return true;
  });

  const login = useServerAction(staffLoginAction, {
    onSuccess: (result) => {
      router.push(result?.redirectUrl || "/dashboard/home");
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

  // Step 1 — pick who you are (Categorized)
  if (!selected) {
    return (
      <div className="flex w-full max-w-md flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-md">
            {logoUrl ? (
              <Image src={logoUrl} alt="" width={56} height={56} className="size-full object-cover" />
            ) : (
              <UtensilsCrossedIcon className="text-muted-foreground size-7" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{restaurantName}</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Personel Girişi · İsminize dokunun</p>
          </div>
        </div>

        {/* Category Tabs & Quick Search */}
        {staff.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {/* Category Chips */}
            {categories.length > 2 && (
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all select-none cursor-pointer",
                      selectedCategory === cat.id
                        ? "border-primary bg-primary text-primary-foreground shadow-xs scale-102"
                        : "border-border/70 bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px]">
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Search */}
            {staff.length > 4 && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Personel adı ile ara…"
                className="h-9 w-full rounded-xl border border-border/80 bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            )}
          </div>
        )}

        {staff.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Giriş yapabilecek personel tanımlanmamış.
            </p>
            <p className="text-xs text-muted-foreground">Lütfen yöneticinize başvurun.</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 p-6 text-center">
            <p className="text-muted-foreground text-xs">Aradığınız kriterde personel bulunamadı.</p>
          </div>
        ) : (
          <ul className="flex max-h-[60svh] flex-col gap-2 overflow-y-auto pr-1">
            {filteredStaff.map((option) => (
              <li key={option.employeeCode} className="animate-in fade-in slide-in-from-left-2 duration-200">
                <button
                  type="button"
                  onClick={() => pick(option)}
                  className="group flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-xs hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-150 cursor-pointer"
                >
                  <Avatar name={option.name} photoUrl={option.photoUrl} className="size-11 text-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-bold text-foreground text-sm">
                        {option.name}
                      </span>
                      <span className="text-xs shrink-0">{ROLE_ICON[option.role] ?? "👤"}</span>
                    </span>
                    <span className="text-muted-foreground block text-xs mt-0.5 truncate">
                      {option.jobTitle || ROLE_LABEL[option.role] || option.role}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 text-xs font-black transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                    Giriş Yap
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
          shakeError && "animate-shake",
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
