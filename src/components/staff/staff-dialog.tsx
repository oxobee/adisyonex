"use client";

import { useState } from "react";
import {
  ArmchairIcon,
  BookOpenIcon,
  BoxesIcon,
  CalculatorIcon,
  CheckIcon,
  ChefHatIcon,
  FileSpreadsheetIcon,
  GiftIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { createStaffAction, updateStaffAction } from "@/actions/staff.actions";
import { PhoneInput } from "@/components/phone-input";
import { StaffPhotoUploader } from "@/components/staff/staff-photo-uploader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  STAFF_ROLE_OPTIONS,
  STAFF_STATUS_OPTIONS,
} from "@/lib/staff";
import { cn } from "@/lib/utils";
import type {
  EmploymentType,
  Gender,
  StaffDTO,
  StaffRole,
  StaffStatus,
} from "@/types/staff";

const trimmed = (value: string) => value.trim() || undefined;

export const AVAILABLE_SCREENS = [
  { id: "/dashboard/kitchen", title: "Mutfak Ekranı & KOT", icon: ChefHatIcon, desc: "Aşçı ve mutfak sipariş ekranı" },
  { id: "/dashboard/orders", title: "Anlık Durum & Masalar", icon: ReceiptTextIcon, desc: "Canlı masa ve sipariş yönetimi" },
  { id: "/dashboard/pos", title: "POS / Kasa", icon: CalculatorIcon, desc: "Hızlı sipariş ve ödeme alma" },
  { id: "/dashboard/menu", title: "Menü Yönetimi", icon: BookOpenIcon, desc: "Kategoriler ve ürünler" },
  { id: "/dashboard/tables", title: "Masalar & Salonlar", icon: ArmchairIcon, desc: "Masa yerleşimi ve QR kodlar" },
  { id: "/dashboard/customers", title: "Kayıtlı Müşteriler", icon: GiftIcon, desc: "Müşteri listesi ve sadakat" },
  { id: "/dashboard/inventory", title: "Stok & Envanter", icon: BoxesIcon, desc: "Hammadde ve kritik stoklar" },
  { id: "/dashboard/staff", title: "Personel Yönetimi", icon: UsersIcon, desc: "Çalışan listesi ve yetkiler" },
  { id: "/dashboard", title: "Yönetim Paneli & Raporlar", icon: LayoutDashboardIcon, desc: "Günlük ciro ve genel grafikler" },
  { id: "/dashboard/z-report", title: "Z Raporu / Gün Sonu", icon: FileSpreadsheetIcon, desc: "Kasa mutabakatı ve gün sonu raporu" },
  { id: "/dashboard/settings", title: "Restoran Ayarları", icon: Settings2Icon, desc: "İşletme profili ve parametreler" },
] as const;

const JOB_PRESETS = [
  { label: "Mutfak", defaultRoutes: ["/dashboard/kitchen"] },
  { label: "Aşçı", defaultRoutes: ["/dashboard/kitchen"] },
  { label: "Garson", defaultRoutes: ["/dashboard/orders"] },
  { label: "Kasiyer", defaultRoutes: ["/dashboard/pos", "/dashboard/orders"] },
  { label: "Mutfak Şefi", defaultRoutes: ["/dashboard/kitchen", "/dashboard/orders"] },
  { label: "Barista", defaultRoutes: ["/dashboard/orders", "/dashboard/pos"] },
  { label: "Komi", defaultRoutes: ["/dashboard/orders"] },
  { label: "Müdür", defaultRoutes: AVAILABLE_SCREENS.map((s) => s.id) },
];

export function StaffDialog({
  staff,
  onOpenChange,
  onSaved,
}: {
  readonly staff: StaffDTO | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employeeCode: staff?.employeeCode ?? "",
    name: staff?.name ?? "",
    jobTitle: staff?.jobTitle ?? "",
    phone: staff?.phone ?? "",
    email: staff?.email ?? "",
    addressLine1: staff?.addressLine1 ?? "",
    addressLine2: staff?.addressLine2 ?? "",
    city: staff?.city ?? "",
    state: staff?.state ?? "",
    postalCode: staff?.postalCode ?? "",
    dateOfBirth: staff?.dateOfBirth?.slice(0, 10) ?? "",
    joiningDate: staff?.joiningDate?.slice(0, 10) ?? "",
    emergencyContactName: staff?.emergencyContactName ?? "",
    emergencyContactPhone: staff?.emergencyContactPhone ?? "",
    notes: staff?.notes ?? "",
  });
  const [allowedRoutes, setAllowedRoutes] = useState<string[]>(
    staff?.allowedRoutes ? [...staff.allowedRoutes] : ["/dashboard/orders"],
  );
  const [role, setRole] = useState<StaffRole>(staff?.role ?? "WAITER");
  const [status, setStatus] = useState<StaffStatus>(staff?.status ?? "ACTIVE");
  const [gender, setGender] = useState<Gender | "">(staff?.gender ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    staff?.employmentType ?? "",
  );
  const [pin, setPin] = useState("");

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const setPhone = (phone: string) => setForm((prev) => ({ ...prev, phone }));

  const toggleRoute = (route: string) => {
    setAllowedRoutes((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route],
    );
  };

  const applyPreset = (preset: typeof JOB_PRESETS[number]) => {
    setForm((prev) => ({ ...prev, jobTitle: preset.label }));
    setAllowedRoutes(preset.defaultRoutes);
  };

  const save = useServerAction(staff ? updateStaffAction : createStaffAction, {
    onSuccess: () => {
      toast.success(staff ? "Personel güncellendi" : "Personel eklendi");
      onOpenChange(false);
      onSaved();
    },
    onError: (message) => toast.error(message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const base = {
      employeeCode: form.employeeCode.trim(),
      name: form.name.trim(),
      jobTitle: trimmed(form.jobTitle),
      allowedRoutes,
      role,
      status,
      phone: form.phone.trim(),
      email: trimmed(form.email),
      addressLine1: trimmed(form.addressLine1),
      addressLine2: trimmed(form.addressLine2),
      city: trimmed(form.city),
      state: trimmed(form.state),
      postalCode: trimmed(form.postalCode),
      dateOfBirth: form.dateOfBirth || undefined,
      gender: gender || undefined,
      joiningDate: form.joiningDate || undefined,
      employmentType: employmentType || undefined,
      emergencyContactName: trimmed(form.emergencyContactName),
      emergencyContactPhone: trimmed(form.emergencyContactPhone),
      notes: trimmed(form.notes),
    };
    save.execute(staff ? { ...base, id: staff.id } : { ...base, pin });
  };

  const pinValid = /^\d{4,6}$/.test(pin);
  const disabled =
    save.isPending ||
    !form.employeeCode.trim() ||
    !form.name.trim() ||
    !form.phone.trim() ||
    (!staff && !pinValid) ||
    allowedRoutes.length === 0;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-foreground">
            {staff ? "Personel Düzenle" : "Yeni Personel Ekle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-5 pt-2">
          {staff ? (
            <div className="flex justify-center">
              <StaffPhotoUploader
                staffId={staff.id}
                photoUrl={staff.photoUrl}
              />
            </div>
          ) : null}

          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="st-code">Personel Kodu / No</FieldLabel>
              <Input
                id="st-code"
                value={form.employeeCode}
                onChange={set("employeeCode")}
                placeholder="Örn: G-01"
                className="rounded-xl font-bold"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="st-name">Ad Soyad</FieldLabel>
              <Input
                id="st-name"
                value={form.name}
                onChange={set("name")}
                placeholder="Örn: Uğur Uğurlu"
                className="rounded-xl font-bold"
                required
              />
            </Field>

            <Field className="col-span-2">
              <FieldLabel htmlFor="st-phone">Telefon Numarası</FieldLabel>
              <PhoneInput
                id="st-phone"
                initialValue={form.phone}
                onChange={setPhone}
              />
            </Field>
          </div>

          {/* Meslek / Görev Unvanı & Hızlı Şablonlar */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-2.5">
            <Field>
              <FieldLabel htmlFor="st-job" className="text-xs font-bold text-foreground">
                Meslek / Görev Unvanı
              </FieldLabel>
              <Input
                id="st-job"
                value={form.jobTitle}
                onChange={set("jobTitle")}
                placeholder="Örn: Garson, Kasiyer, Mutfak Şefi, Barista..."
                className="rounded-xl font-semibold bg-background"
              />
            </Field>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                Hızlı Meslek ve Yetki Şablonu Seç:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {JOB_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                      form.jobTitle === preset.label
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-foreground hover:bg-muted/80",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ekran & Menü Yetkileri (Granular Screen Permissions) */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheckIcon className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Görüntülenecek Ekran & Menü Yetkileri
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllowedRoutes(AVAILABLE_SCREENS.map((s) => s.id))}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Tümünü Seç
                </button>
                <span className="text-muted-foreground text-xs">·</span>
                <button
                  type="button"
                  onClick={() => setAllowedRoutes([])}
                  className="text-[11px] font-bold text-destructive hover:underline cursor-pointer"
                >
                  Temizle
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Personel giriş yaptığında sadece seçtiğiniz ekranlar sol menüde görünecek ve diğer sayfalara erişimi engellenecektir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {AVAILABLE_SCREENS.map((screen) => {
                const isSelected = allowedRoutes.includes(screen.id);
                const Icon = screen.icon;
                return (
                  <div
                    key={screen.id}
                    onClick={() => toggleRoute(screen.id)}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-5 items-center justify-center rounded-md border shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/30 bg-background",
                      )}
                    >
                      {isSelected && <CheckIcon className="size-3 stroke-[3]" />}
                    </div>
                    <Icon className={cn("size-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-xs truncate">{screen.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{screen.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sistem Rolü & Durumu */}
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="st-role">Sistem Rolü</FieldLabel>
              <Select value={role} onValueChange={(v) => v && setRole(v as StaffRole)}>
                <SelectTrigger id="st-role" className="rounded-xl font-medium">
                  <span>
                    {STAFF_ROLE_OPTIONS.find((o) => o.value === role)?.label}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="st-status">Çalışma Durumu</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => v && setStatus(v as StaffStatus)}
              >
                <SelectTrigger id="st-status" className="rounded-xl font-medium">
                  <span>
                    {STAFF_STATUS_OPTIONS.find((o) => o.value === status)?.label}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {STAFF_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {staff ? null : (
            <Field>
              <FieldLabel htmlFor="st-pin">Giriş PIN Kodu (4–6 Haneli)</FieldLabel>
              <Input
                id="st-pin"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••"
                className="rounded-xl font-bold tracking-widest text-center text-base"
              />
              <p className="text-muted-foreground text-xs mt-1">
                Personel Girişi ekranında oturum açmak için kullanılır.
              </p>
            </Field>
          )}

          {/* İletişim & Kişisel Bilgiler Accordion */}
          <div className="border-border/60 flex flex-col gap-3 border-t pt-3">
            <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              İsteğe Bağlı Ek Bilgiler
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field className="col-span-2">
                <FieldLabel htmlFor="st-email">E-posta</FieldLabel>
                <Input
                  id="st-email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="İsteğe bağlı"
                  className="rounded-xl"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="st-city">İlçe</FieldLabel>
                <Input id="st-city" value={form.city} onChange={set("city")} className="rounded-xl" />
              </Field>
              <Field>
                <FieldLabel htmlFor="st-state">İl / Şehir</FieldLabel>
                <Input id="st-state" value={form.state} onChange={set("state")} className="rounded-xl" />
              </Field>
              <Field className="col-span-2">
                <FieldLabel htmlFor="st-notes">Notlar</FieldLabel>
                <Textarea
                  id="st-notes"
                  value={form.notes}
                  onChange={set("notes")}
                  rows={2}
                  className="rounded-xl text-xs resize-none"
                />
              </Field>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold cursor-pointer"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={disabled}
              className="rounded-xl font-black bg-primary text-primary-foreground cursor-pointer"
            >
              {save.isPending ? "Kaydediliyor…" : staff ? "Değişiklikleri Kaydet" : "Personeli Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
