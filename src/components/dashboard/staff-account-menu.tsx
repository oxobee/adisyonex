"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  KeyRoundIcon,
  LogOutIcon,
  PlusIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UserCheck2Icon,
  UserIcon,
  UserPlus2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addStaffAccountAction,
  switchStaffAccountAction,
  updateStaffSelfProfileAction,
} from "@/actions/staff-auth.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface StaffAccount {
  id: string;
  name: string;
  role: string;
  jobTitle?: string | null;
  employeeCode?: string | null;
  allowedRoutes?: readonly string[] | null;
  photoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
}

const STORAGE_KEY = "adisyon_terminal_accounts_v1";

function formatStaffRole(role: string): string {
  switch (role.toUpperCase()) {
    case "ADMIN":
    case "SUPER_ADMIN":
    case "MANAGER":
      return "Yönetici";
    case "WAITER":
      return "Garson";
    case "CHEF":
      return "Aşçı / Mutfak";
    case "CASHIER":
      return "Kasiyer";
    case "BARTENDER":
      return "Barista";
    case "HOST":
      return "Karşılama";
    case "COURIER":
      return "Kurye";
    default:
      return role;
  }
}

export function StaffAccountMenu({
  initialAccount,
  onActiveAccountChange,
  isMobile = false,
}: {
  readonly initialAccount: StaffAccount;
  readonly onActiveAccountChange: (account: StaffAccount) => void;
  readonly isMobile?: boolean;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<StaffAccount[]>([initialAccount]);
  const [activeAccount, setActiveAccount] = useState<StaffAccount>(initialAccount);

  // Add account dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addCode, setAddCode] = useState("");
  const [addPin, setAddPin] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Settings dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: initialAccount.name,
    phone: initialAccount.phone || "",
    email: initialAccount.email || "",
    city: initialAccount.city || "",
    state: initialAccount.state || "",
    photoUrl: initialAccount.photoUrl || "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Load and merge stored accounts on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StaffAccount[] = JSON.parse(raw);
        if (Array.isArray(stored) && stored.length > 0) {
          // Merge initialAccount if not already in list
          const exists = stored.some((a) => a.id === initialAccount.id);
          const merged = exists ? stored : [initialAccount, ...stored];
          setAccounts(merged);

          // Find active or fallback to initial
          const activeId = localStorage.getItem("adisyon_active_account_id");
          const found = merged.find((a) => a.id === activeId) || initialAccount;
          setActiveAccount(found);
          onActiveAccountChange(found);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load accounts:", e);
    }
    setAccounts([initialAccount]);
    setActiveAccount(initialAccount);
    onActiveAccountChange(initialAccount);
  }, [initialAccount, onActiveAccountChange]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const saveAccounts = (newAccounts: StaffAccount[], newActive?: StaffAccount) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
      if (newActive) {
        localStorage.setItem("adisyon_active_account_id", newActive.id);
        setActiveAccount(newActive);
        onActiveAccountChange(newActive);
      }
    } catch (e) {
      console.error("Failed to persist accounts:", e);
    }
  };

  const handleSwitchAccount = async (target: StaffAccount) => {
    if (target.id === activeAccount.id) {
      setIsOpen(false);
      return;
    }
    try {
      const res = await switchStaffAccountAction(target.id);
      if (res.success) {
        saveAccounts(accounts, target);
        toast.success(`${target.name} hesabına geçiş yapıldı (${formatStaffRole(target.role)})`);
        setIsOpen(false);
        router.refresh();
      } else {
        // Still allow local switch if offline
        saveAccounts(accounts, target);
        toast.success(`Lokal: ${target.name} hesabına geçildi`);
        setIsOpen(false);
      }
    } catch {
      saveAccounts(accounts, target);
      setIsOpen(false);
    }
  };

  const handleRemoveAccount = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (accounts.length <= 1) {
      toast.error("En az bir hesap açık kalmalıdır.");
      return;
    }
    const filtered = accounts.filter((a) => a.id !== id);
    const nextActive = activeAccount.id === id ? filtered[0] : activeAccount;
    saveAccounts(filtered, nextActive);
    toast.success("Hesap bu cihazdan kaldırıldı.");
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCode.trim() || !addPin.trim()) {
      toast.error("Lütfen personel kodu ve PIN girin.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await addStaffAccountAction({
        employeeCode: addCode.trim(),
        pin: addPin.trim(),
      });

      if (res.success && res.data) {
        const newAcc: StaffAccount = res.data;
        const exists = accounts.some((a) => a.id === newAcc.id);
        const updated = exists
          ? accounts.map((a) => (a.id === newAcc.id ? newAcc : a))
          : [...accounts, newAcc];

        saveAccounts(updated, newAcc);
        toast.success(`${newAcc.name} başarıyla eklendi ve aktif hesaba geçildi!`);
        setIsAddOpen(false);
        setAddCode("");
        setAddPin("");
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Personel doğrulanamadı.");
      }
    } catch {
      toast.error("Giriş yapılırken bir hata oluştu.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleOpenSettings = () => {
    setProfileForm({
      name: activeAccount.name,
      phone: activeAccount.phone || "",
      email: activeAccount.email || "",
      city: activeAccount.city || "",
      state: activeAccount.state || "",
      photoUrl: activeAccount.photoUrl || "",
    });
    setIsOpen(false);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error("Ad Soyad zorunludur.");
      return;
    }

    setSettingsLoading(true);
    try {
      const res = await updateStaffSelfProfileAction({
        id: activeAccount.id,
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim() || null,
        city: profileForm.city.trim() || null,
        state: profileForm.state.trim() || null,
        photoUrl: profileForm.photoUrl.trim() || null,
      });

      if (res.success) {
        const updatedActive = {
          ...activeAccount,
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
          email: profileForm.email.trim() || null,
          city: profileForm.city.trim() || null,
          state: profileForm.state.trim() || null,
          photoUrl: profileForm.photoUrl.trim() || null,
        };

        const updatedList = accounts.map((a) => (a.id === activeAccount.id ? updatedActive : a));
        saveAccounts(updatedList, updatedActive);
        toast.success("Profil bilgileri başarıyla güncellendi!");
        setIsSettingsOpen(false);
      } else {
        toast.error(res.error || "Güncelleme başarısız.");
      }
    } catch {
      toast.error("Profil güncellenirken hata oluştu.");
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 hover:border-gray-300 shadow-2xs transition-all active:scale-95 cursor-pointer text-left",
          isMobile ? "px-2.5 py-1" : "px-3.5 py-1.5"
        )}
        title="Hesap ve Personel Seçimi"
      >
        {activeAccount.photoUrl ? (
          <div className="relative size-6 sm:size-7 rounded-full overflow-hidden shrink-0 border border-gray-200">
            <Image
              src={activeAccount.photoUrl}
              alt={activeAccount.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-black shrink-0">
            {activeAccount.name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="flex flex-col text-left min-w-0 pr-0.5">
          <span className="text-xs font-black text-gray-900 leading-tight truncate max-w-[110px] sm:max-w-[140px]">
            {activeAccount.name}
          </span>
          <span className="text-[10px] font-bold text-gray-400 leading-tight truncate">
            {formatStaffRole(activeAccount.role)}
          </span>
        </div>

        <ChevronDownIcon
          className={cn("size-3.5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* HEADER */}
          <div className="p-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck2Icon className="size-4 text-primary" />
              <span className="text-xs font-black text-gray-900">Kayıtlı Personel & Hesaplar</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {accounts.length} Hesap
            </span>
          </div>

          {/* ACCOUNTS LIST */}
          <div className="p-2 flex flex-col gap-1 max-h-56 overflow-y-auto">
            {accounts.map((acc) => {
              const isActive = acc.id === activeAccount.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => handleSwitchAccount(acc)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer group",
                    isActive
                      ? "bg-primary/5 border border-primary/20 text-primary"
                      : "hover:bg-gray-50 text-gray-800"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {acc.photoUrl ? (
                      <div className="relative size-7 rounded-full overflow-hidden shrink-0 border border-gray-200">
                        <Image src={acc.photoUrl} alt={acc.name} fill className="object-cover" unoptimized />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full text-xs font-black shrink-0",
                          isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {acc.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-gray-900 truncate">{acc.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 truncate">
                        {formatStaffRole(acc.role)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2Icon className="size-3" />
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-primary transition-colors pr-1">
                        Hesaba Geç
                      </span>
                    )}

                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveAccount(acc.id, e)}
                        className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Bu hesaptan çıkış yap"
                      >
                        <LogOutIcon className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIONS: HESAP EKLE + HESAP AYARLARI */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-white hover:text-primary transition-colors cursor-pointer shadow-2xs border border-transparent hover:border-gray-200"
            >
              <UserPlus2Icon className="size-4 text-primary" />
              <span>+ Yeni Personel Hesabı Ekle</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSettings}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-white hover:text-primary transition-colors cursor-pointer shadow-2xs border border-transparent hover:border-gray-200"
            >
              <Settings2Icon className="size-4 text-gray-500" />
              <span>Hesap & Profil Ayarları</span>
            </button>
          </div>
        </div>
      )}

      {/* DIALOG 1: HESAP EKLE */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <UserPlus2Icon className="size-5 text-primary" />
                <span>Yeni Personel Hesabı Ekle</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Bu terminalde oturum açıp hızlıca hesap değiştirebilmek için personel kodunuzu ve PIN şifrenizi girin.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-code-input" className="text-xs font-bold text-foreground">
                  Personel Kodu
                </label>
                <Input
                  id="staff-code-input"
                  placeholder="Örn: GARS01"
                  value={addCode}
                  onChange={(e) => setAddCode(e.target.value.toUpperCase())}
                  className="rounded-xl font-mono font-bold"
                  autoFocus
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staff-pin-input" className="text-xs font-bold text-foreground">
                  Giriş PIN Kodu (4 Hane)
                </label>
                <Input
                  id="staff-pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={addPin}
                  onChange={(e) => setAddPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="rounded-xl font-mono text-center text-xl tracking-[0.3em] font-black"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl font-bold"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={addLoading || !addCode || !addPin}
                className="rounded-xl font-black bg-primary text-primary-foreground gap-2"
              >
                {addLoading ? "Doğrulanıyor…" : "Hesabı Ekle & Giriş Yap"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: HESAP & PROFİL AYARLARI */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <Settings2Icon className="size-5 text-primary" />
                <span>Hesap & Profil Ayarları</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {activeAccount.name} kullanıcısının iletişim ve profil bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3.5 py-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-name" className="text-xs font-bold text-foreground">
                    Adı Soyadı
                  </label>
                  <Input
                    id="set-name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-phone" className="text-xs font-bold text-foreground">
                    Telefon Numarası
                  </label>
                  <Input
                    id="set-phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="0555 123 45 67"
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="set-email" className="text-xs font-bold text-foreground">
                  E-posta Adresi
                </label>
                <Input
                  id="set-email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="ornek@adisyonex.com"
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-city" className="text-xs font-bold text-foreground">
                    İl
                  </label>
                  <Input
                    id="set-city"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="İstanbul"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-state" className="text-xs font-bold text-foreground">
                    İlçe
                  </label>
                  <Input
                    id="set-state"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm((p) => ({ ...p, state: e.target.value }))}
                    placeholder="Kadıköy"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="set-photo" className="text-xs font-bold text-foreground">
                  Profil Fotoğrafı Bağlantısı (URL)
                </label>
                <Input
                  id="set-photo"
                  value={profileForm.photoUrl}
                  onChange={(e) => setProfileForm((p) => ({ ...p, photoUrl: e.target.value }))}
                  placeholder="https://.../avatar.jpg"
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                className="rounded-xl font-bold"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                disabled={settingsLoading || !profileForm.name.trim()}
                className="rounded-xl font-black bg-primary text-primary-foreground gap-2"
              >
                {settingsLoading ? "Kaydediliyor…" : "Bilgileri Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
