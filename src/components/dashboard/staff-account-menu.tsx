"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  KeyRoundIcon,
  Loader2Icon,
  LogOutIcon,
  SearchIcon,
  Settings2Icon,
  UploadIcon,
  UserCheck2Icon,
  UserPlus2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addStaffAccountAction,
  getRestaurantStaffListForTerminalAction,
  switchStaffAccountAction,
  updateStaffSelfProfileAction,
  type TerminalStaffOption,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<StaffAccount[]>([initialAccount]);
  const [activeAccount, setActiveAccount] = useState<StaffAccount>(initialAccount);

  // Switch account PIN dialog state
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false);
  const [switchTargetAccount, setSwitchTargetAccount] = useState<StaffAccount | null>(null);
  const [switchPin, setSwitchPin] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);

  // Add account dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [staffList, setStaffList] = useState<TerminalStaffOption[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<TerminalStaffOption | null>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [manualCodeMode, setManualCodeMode] = useState(false);
  const [addCode, setAddCode] = useState("");
  const [addPin, setAddPin] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Settings dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    state: "",
    photoUrl: "",
  });

  // Load saved accounts from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const currentExists = parsed.some((a: StaffAccount) => a.id === initialAccount.id);
          const merged = currentExists
            ? parsed.map((a: StaffAccount) => (a.id === initialAccount.id ? { ...a, ...initialAccount } : a))
            : [initialAccount, ...parsed];

          setAccounts(merged);
          setActiveAccount(initialAccount);
          onActiveAccountChange(initialAccount);
          return;
        }
      }
    } catch {
      // ignore
    }

    setAccounts([initialAccount]);
    setActiveAccount(initialAccount);
    onActiveAccountChange(initialAccount);
    try {
      localStorage.setItem("adisyon_active_staff_id", initialAccount.id);
      localStorage.setItem("adisyon_active_staff_account", JSON.stringify(initialAccount));
      window.dispatchEvent(new CustomEvent("active-account-changed", { detail: initialAccount }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAccount.id]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveAccounts = (newAccounts: StaffAccount[], newActive: StaffAccount) => {
    setAccounts(newAccounts);
    setActiveAccount(newActive);
    onActiveAccountChange(newActive);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
      localStorage.setItem("adisyon_active_staff_id", newActive.id);
      localStorage.setItem("adisyon_active_staff_account", JSON.stringify(newActive));
      window.dispatchEvent(new CustomEvent("active-account-changed", { detail: newActive }));
    } catch {
      // ignore
    }
  };

  const handleInitiateSwitch = (target: StaffAccount) => {
    if (target.id === activeAccount.id) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setSwitchTargetAccount(target);
    setSwitchPin("");
    setIsSwitchDialogOpen(true);
  };

  const handleConfirmSwitchWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTargetAccount) return;
    if (!switchPin.trim()) {
      toast.error("Lütfen PIN şifrenizi girin.");
      return;
    }

    setSwitchLoading(true);
    try {
      const res = await switchStaffAccountAction({
        staffId: switchTargetAccount.id,
        pin: switchPin.trim(),
      });

      if (res.success) {
        // Switch active account; current accounts list is preserved!
        saveAccounts(accounts, switchTargetAccount);
        toast.success(`${switchTargetAccount.name} hesabına geçiş yapıldı`);
        setIsSwitchDialogOpen(false);
        setSwitchPin("");
        setSwitchTargetAccount(null);
        router.refresh();
      } else {
        toast.error(res.error || "Hatalı şifre veya PIN kodu.");
      }
    } catch {
      toast.error("Hesap değiştirilirken bir hata oluştu.");
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleRemoveAccount = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetToRemove = accounts.find((a) => a.id === id);
    const filtered = accounts.filter((a) => a.id !== id);

    if (activeAccount.id === id) {
      // Exiting currently active account
      if (filtered.length > 0) {
        setAccounts(filtered);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        } catch {}
        toast.info(`${targetToRemove?.name || "Hesap"} listeden kaldırıldı. Kalan hesaba geçiş yapın.`);
        handleInitiateSwitch(filtered[0]);
      } else {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        toast.info("Tüm hesaplardan çıkış yapıldı.");
        router.push("/personelgiris");
      }
      return;
    }

    // Removing another non-active account from the list
    saveAccounts(filtered, activeAccount);
    toast.success(`${targetToRemove?.name || "Hesap"} kayıtlı hesaplar listesinden silindi.`);
  };

  const handleOpenAddDialog = async () => {
    setIsOpen(false);
    setIsAddOpen(true);
    setSelectedStaff(null);
    setManualCodeMode(false);
    setAddCode("");
    setAddPin("");
    setStaffSearch("");
    setLoadingStaff(true);
    try {
      const res = await getRestaurantStaffListForTerminalAction();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSelectStaff = (st: TerminalStaffOption) => {
    setSelectedStaff(st);
    setAddCode(st.employeeCode);
    setAddPin("");
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = addCode.trim() || selectedStaff?.employeeCode || "";
    if (!code || !addPin.trim()) {
      toast.error("Lütfen personel seçin ve PIN şifresini girin.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await addStaffAccountAction({
        employeeCode: code,
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
        setSelectedStaff(null);
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Personel doğrulanamadı. Lütfen PIN kodunu kontrol edin.");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      toast.error("Görsel boyutu en fazla 6MB olabilir.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 360;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setProfileForm((prev) => ({ ...prev, photoUrl: dataUrl }));
          toast.success("Fotoğraf seçildi.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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

  const filteredStaffList = staffList.filter((s) => {
    if (!staffSearch.trim()) return true;
    const q = staffSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.employeeCode.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative shrink-0" ref={menuRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white border border-gray-200 hover:border-gray-300 shadow-2xs transition-all active:scale-95 cursor-pointer text-left shrink-0",
          isMobile ? "px-2 py-1 max-w-[150px]" : "px-3.5 py-1.5"
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
          <span className={cn(
            "text-xs font-black text-gray-900 leading-tight truncate",
            isMobile ? "max-w-[65px] sm:max-w-[120px]" : "max-w-[110px] sm:max-w-[140px]"
          )}>
            {activeAccount.name}
          </span>
          <span className={cn(
            "text-[10px] font-bold text-gray-400 leading-tight truncate",
            isMobile ? "max-w-[65px] sm:max-w-[120px]" : "max-w-[110px] sm:max-w-[140px]"
          )}>
            {formatStaffRole(activeAccount.role)}
          </span>
        </div>

        <ChevronDownIcon
          className={cn("size-3.5 text-gray-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180")}
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
                  onClick={() => {
                    if (!isActive) {
                      handleInitiateSwitch(acc);
                    } else {
                      setIsOpen(false);
                    }
                  }}
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

                  <div className="flex items-center gap-1.5 shrink-0">
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

                    <button
                      type="button"
                      onClick={(e) => handleRemoveAccount(acc.id, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hesaptan çıkış yap ve bu listeden kaldır"
                    >
                      <LogOutIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIONS: YENİ HESAP EKLE + HESAP AYARLARI */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-1">
            <button
              type="button"
              onClick={handleOpenAddDialog}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-white hover:text-primary transition-colors cursor-pointer shadow-2xs border border-transparent hover:border-gray-200"
            >
              <UserPlus2Icon className="size-4 text-primary" />
              <span>Yeni Hesap Ekle</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSettings}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-white hover:text-primary transition-colors cursor-pointer shadow-2xs border border-transparent hover:border-gray-200"
            >
              <Settings2Icon className="size-4 text-gray-500" />
              <span>Hesap Ayarları</span>
            </button>
          </div>
        </div>
      )}

      {/* DIALOG 1: YENİ HESAP EKLE (PERSONEL LİSTESİNDEN SEÇİM) */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <UserPlus2Icon className="size-5 text-primary" />
                  <span>Yeni Hesap Ekle</span>
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="size-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
              <DialogDescription className="text-xs">
                {selectedStaff
                  ? `${selectedStaff.name} hesabını bu terminale eklemek için PIN şifrenizi girin.`
                  : "Bu terminalde oturum açmak istediğiniz personeli seçin."}
              </DialogDescription>
            </DialogHeader>

            {/* SEÇİM GÖRÜNÜMÜ VEYA MANUEL GİRİŞ */}
            {!manualCodeMode ? (
              <div className="flex flex-col gap-3">
                {selectedStaff ? (
                  /* SEÇİLEN PERSONEL KARTI */
                  <div className="p-3.5 rounded-2xl border-2 border-primary/40 bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedStaff.photoUrl ? (
                        <div className="relative size-11 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                          <Image src={selectedStaff.photoUrl} alt={selectedStaff.name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white text-base font-black shrink-0">
                          {selectedStaff.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-gray-900 truncate">{selectedStaff.name}</span>
                        <span className="text-xs font-semibold text-primary">
                          {formatStaffRole(selectedStaff.role)} · {selectedStaff.employeeCode}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(null);
                        setAddPin("");
                      }}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-2xs transition-all active:scale-95"
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  /* PERSONEL LİSTESİ */
                  <div className="flex flex-col gap-2">
                    {/* Arama Kutusu */}
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        placeholder="Personel ara (isim, unvan, kod)..."
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        className="pl-9 rounded-xl text-xs"
                      />
                    </div>

                    {loadingStaff ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                        <Loader2Icon className="size-6 animate-spin text-primary" />
                        <span className="text-xs font-medium">Personel listesi yükleniyor…</span>
                      </div>
                    ) : filteredStaffList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 gap-1">
                        <span className="text-xs font-bold text-gray-700">Personel bulunamadı</span>
                        <p className="text-[11px] text-gray-400">
                          {staffSearch ? "Arama kriterine uygun çalışan yok." : "Kayıtlı aktif personel bulunmuyor."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {filteredStaffList.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => handleSelectStaff(st)}
                            className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group active:scale-98"
                          >
                            {st.photoUrl ? (
                              <div className="relative size-8 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                <Image src={st.photoUrl} alt={st.name} fill className="object-cover" unoptimized />
                              </div>
                            ) : (
                              <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700 group-hover:bg-primary group-hover:text-white text-xs font-black shrink-0 transition-colors">
                                {st.name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-black text-gray-900 group-hover:text-primary truncate">
                                {st.name}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 truncate">
                                {formatStaffRole(st.role)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setManualCodeMode(true)}
                      className="text-xs font-bold text-primary hover:underline text-center pt-1"
                    >
                      veya Personel Kodu ile Manuel Girin
                    </button>
                  </div>
                )}

                {/* PIN GİRİŞİ (Sadece personel seçildiyse gösterilir) */}
                {selectedStaff && (
                  <div className="flex flex-col gap-1.5 pt-1 animate-in fade-in duration-150">
                    <label htmlFor="staff-pin-input-select" className="text-xs font-bold text-foreground">
                      Giriş PIN Kodu (4 Hane)
                    </label>
                    <Input
                      id="staff-pin-input-select"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="••••"
                      value={addPin}
                      onChange={(e) => setAddPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="rounded-xl font-mono text-center text-xl tracking-[0.3em] font-black"
                      autoFocus
                      required
                    />
                  </div>
                )}
              </div>
            ) : (
              /* MANUEL GİRİŞ MODU */
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setManualCodeMode(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 self-start"
                >
                  <ArrowLeftIcon className="size-3" />
                  <span>Personel Listesine Dön</span>
                </button>

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
                  <label htmlFor="staff-pin-input-manual" className="text-xs font-bold text-foreground">
                    Giriş PIN Kodu (4 Hane)
                  </label>
                  <Input
                    id="staff-pin-input-manual"
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
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
                disabled={addLoading || (!selectedStaff && !addCode) || !addPin}
                className="rounded-xl font-black bg-primary text-primary-foreground gap-2"
              >
                {addLoading ? "Doğrulanıyor…" : "Hesabı Ekle & Giriş Yap"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: HESAP AYARLARI (CİHAZDAN FOTOĞRAF SEÇME DESTEKLİ) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto p-6">
          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-black flex items-center gap-2">
                  <Settings2Icon className="size-5 text-primary" />
                  <span>Hesap Ayarları</span>
                </DialogTitle>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="size-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <XIcon className="size-4" />
                </button>
              </div>
              <DialogDescription className="text-xs">
                {activeAccount.name} kullanıcısının hesap ve profil bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              {/* PROFİL FOTOĞRAFI: CİHAZDAN SEÇİM */}
              <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
                <span className="text-xs font-bold text-foreground">Profil Fotoğrafı</span>
                <div className="flex items-center gap-4">
                  <div className="relative size-16 rounded-2xl overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center shrink-0 shadow-xs">
                    {profileForm.photoUrl ? (
                      <Image
                        src={profileForm.photoUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-2xl font-black text-gray-400">
                        {profileForm.name ? profileForm.name.slice(0, 1).toUpperCase() : "?"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl font-bold text-xs gap-1.5 self-start shadow-2xs"
                    >
                      <UploadIcon className="size-3.5 text-primary" />
                      <span>Cihazdan Fotoğraf Seç</span>
                    </Button>

                    {profileForm.photoUrl ? (
                      <button
                        type="button"
                        onClick={() => setProfileForm((p) => ({ ...p, photoUrl: "" }))}
                        className="text-[11px] font-bold text-rose-600 hover:underline text-left cursor-pointer"
                      >
                        Fotoğrafı Kaldır
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400">
                        PNG, JPG veya WebP (Cihazınızdan otomatik optimize edilir)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* İSİM & TELEFON */}
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

              {/* E-POSTA */}
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

              {/* İL & İLÇE */}
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
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
                disabled={settingsLoading}
                className="rounded-xl font-black bg-primary text-primary-foreground gap-2"
              >
                {settingsLoading ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SEÇİLEN HESABA GEÇİŞ PIN DOĞRULAMA MODALI */}
      <Dialog open={isSwitchDialogOpen} onOpenChange={(open) => !open && setIsSwitchDialogOpen(false)}>
        <DialogContent className="max-w-sm rounded-3xl p-6 text-center border border-gray-200 shadow-2xl">
          <DialogHeader className="flex flex-col items-center gap-2">
            {switchTargetAccount?.photoUrl ? (
              <div className="relative size-16 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                <Image
                  src={switchTargetAccount.photoUrl}
                  alt={switchTargetAccount.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-black shadow-inner">
                {switchTargetAccount?.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <DialogTitle className="text-base font-black text-gray-900 mt-1">
              {switchTargetAccount?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              {switchTargetAccount && formatStaffRole(switchTargetAccount.role)} • Bu hesaba geçiş yapmak için lütfen şifrenizi / PIN kodunuzu girin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmSwitchWithPin} className="space-y-4 mt-3">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <KeyRoundIcon className="size-3.5 text-primary" />
                <span>PIN Şifresi</span>
              </label>
              <Input
                type="password"
                inputMode="numeric"
                autoFocus
                value={switchPin}
                onChange={(e) => setSwitchPin(e.target.value)}
                placeholder="PIN kodunuzu girin"
                className="h-12 text-center text-lg font-mono tracking-widest rounded-2xl bg-gray-50 border-gray-200"
                maxLength={8}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSwitchDialogOpen(false);
                  setSwitchTargetAccount(null);
                  setSwitchPin("");
                }}
                className="h-11 rounded-2xl font-bold text-xs cursor-pointer"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                disabled={switchLoading || !switchPin.trim()}
                className="h-11 rounded-2xl font-black text-xs text-white bg-primary hover:bg-primary/90 shadow-md cursor-pointer active:scale-95 transition-transform"
              >
                {switchLoading ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                    Doğrulanıyor...
                  </>
                ) : (
                  "Giriş Yap & Geç"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
