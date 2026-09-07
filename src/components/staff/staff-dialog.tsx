"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArmchairIcon,
  BookOpenIcon,
  BoxesIcon,
  BriefcaseIcon,
  CalculatorIcon,
  CheckIcon,
  ChefHatIcon,
  FileSpreadsheetIcon,
  GiftIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { createStaffAction, updateStaffAction, resetPinAction } from "@/actions/staff.actions";
import { getZonesAndRolesAction } from "@/actions/zone-and-role.actions";
import { PhoneInput } from "@/components/phone-input";
import { StaffPhotoUploader } from "@/components/staff/staff-photo-uploader";
import { ManageStaffRolesDialog } from "@/components/staff/manage-staff-roles-dialog";
import { ManageZonesDialog } from "@/components/staff/manage-zones-dialog";
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
  STAFF_STATUS_OPTIONS,
} from "@/lib/staff";
import {
  PERMISSION_MATRIX_GROUPS,
  ALL_PERMISSION_ROUTE_IDS,
  getDefaultRoutesForRoleTitle,
} from "@/lib/permission-matrix";
import { cn } from "@/lib/utils";
import type {
  EmploymentType,
  Gender,
  RestaurantStaffRoleDTO,
  RestaurantZoneDTO,
  StaffDTO,
  StaffRole,
  StaffStatus,
} from "@/types/staff";

const trimmed = (value: string) => value.trim() || undefined;
 
function deriveSystemEnumRole(roleName: string): StaffRole {
  const lower = roleName.toLowerCase();
  if (lower.includes("aşçı") || lower.includes("mutfak")) return "KITCHEN";
  if (lower.includes("garson") || lower.includes("komi") || lower.includes("barista")) return "WAITER";
  if (lower.includes("kasiyer") || lower.includes("kasa")) return "CASHIER";
  if (lower.includes("müdür") || lower.includes("yönet")) return "MANAGEMENT";
  return "OTHER";
}



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

  const [roles, setRoles] = useState<RestaurantStaffRoleDTO[]>([]);
  const [zones, setZones] = useState<RestaurantZoneDTO[]>([]);
  const [customRoleId, setCustomRoleId] = useState<string>(
    staff?.customRoleId || staff?.customRole?.id || ""
  );
  const [zoneId, setZoneId] = useState<string>(
    staff?.zoneId || staff?.zone?.id || ""
  );

  const [manageRolesOpen, setManageRolesOpen] = useState(false);
  const [manageZonesOpen, setManageZonesOpen] = useState(false);

  const [allowedRoutes, setAllowedRoutes] = useState<string[]>(
    staff?.allowedRoutes ? [...staff.allowedRoutes] : ["/dashboard/orders"]
  );
  const [status, setStatus] = useState<StaffStatus>(staff?.status ?? "ACTIVE");
  const [gender, setGender] = useState<Gender | "">(staff?.gender ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    staff?.employmentType ?? ""
  );
  const [pin, setPin] = useState("");

  const loadRolesAndZones = useCallback(async () => {
    const res = await getZonesAndRolesAction();
    if (res.success && res.data) {
      setRoles(res.data.roles);
      setZones(res.data.zones);

      // If staff has no customRoleId, attempt to match with existing roles by name or jobTitle
      if (!staff?.customRoleId && !customRoleId && res.data.roles.length > 0) {
        const found = res.data.roles.find(
          (r) =>
            r.name.toLowerCase() === (staff?.jobTitle || "").toLowerCase() ||
            r.name.toLowerCase() === "garson"
        );
        if (found) {
          setCustomRoleId(found.id);
        } else {
          const defaultR = res.data.roles.find((r) => r.isDefault) || res.data.roles[0];
          if (defaultR) setCustomRoleId(defaultR.id);
        }
      }

      // If staff has no zoneId, attempt to match or fallback to default
      if (!staff?.zoneId && !zoneId && res.data.zones.length > 0) {
        const defaultZ = res.data.zones.find((z) => z.isDefault) || res.data.zones[0];
        if (defaultZ) setZoneId(defaultZ.id);
      }
    }
  }, [staff, customRoleId, zoneId]);

  useEffect(() => {
    loadRolesAndZones();
  }, [loadRolesAndZones]);

  const set = (key: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const setPhone = (phone: string) => setForm((prev) => ({ ...prev, phone }));

  const toggleRoute = (route: string) => {
    setAllowedRoutes((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
    );
  };

  const toggleGroup = (itemIds: string[]) => {
    const allSelected = itemIds.every((id) => allowedRoutes.includes(id));
    if (allSelected) {
      setAllowedRoutes((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setAllowedRoutes((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const handleRoleChange = (roleId: string) => {
    setCustomRoleId(roleId);
    const selectedRole = roles.find((r) => r.id === roleId);
    if (selectedRole) {
      setForm((prev) => ({ ...prev, jobTitle: selectedRole.name }));
      // If newly creating staff, suggest default routes for this role
      if (!staff) {
        setAllowedRoutes(getDefaultRoutesForRoleTitle(selectedRole.name));
      }
    }
  };

  const save = useServerAction(staff ? updateStaffAction : createStaffAction, {
    onSuccess: () => {
      toast.success(staff ? "Personel güncellendi" : "Personel eklendi");
      onOpenChange(false);
      onSaved();
    },
    onError: (message) => toast.error(message),
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedRole = roles.find((r) => r.id === customRoleId);
    const roleTitle = selectedRole?.name || form.jobTitle;
    const systemRoleEnum = deriveSystemEnumRole(roleTitle);

    const base = {
      employeeCode: form.employeeCode.trim(),
      name: form.name.trim(),
      jobTitle: trimmed(roleTitle),
      customRoleId: customRoleId || undefined,
      zoneId: zoneId || undefined,
      allowedRoutes,
      role: systemRoleEnum,
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
    if (staff) {
      save.execute({ ...base, id: staff.id });
      if (pin && pinValid) {
        await resetPinAction({ id: staff.id, pin });
      }
    } else {
      save.execute({ ...base, pin });
    }
  };

  const pinValid = /^\d{4}$/.test(pin);
  const disabled =
    save.isPending ||
    !form.employeeCode.trim() ||
    !form.name.trim() ||
    !form.phone.trim() ||
    (!staff && !pinValid) ||
    allowedRoutes.length === 0;

  const currentRole = roles.find((r) => r.id === customRoleId) || staff?.customRole;
  const currentZone = zones.find((z) => z.id === zoneId) || staff?.zone;

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">
              {staff ? "Personel Düzenle" : "Yeni Personel Ekle"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Personelin temel bilgilerini, sistem rolünü, çalışma bölgesini ve ekran yetkilerini tanımlayın.
            </DialogDescription>
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

            {/* Temel Bilgiler: Kullanıcı Kodu, Ad Soyad, Telefon, Adres */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="st-code">Personel No / Kullanıcı Kodu</FieldLabel>
                <Input
                  id="st-code"
                  value={form.employeeCode}
                  onChange={set("employeeCode")}
                  placeholder="Örn: M-01"
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
                  placeholder="Örn: Ahmet Yılmaz"
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

              <Field className="col-span-2 sm:col-span-1">
                <FieldLabel htmlFor="st-address">Adres</FieldLabel>
                <Input
                  id="st-address"
                  value={form.addressLine1}
                  onChange={set("addressLine1")}
                  placeholder="Örn: Kadıköy Mah. 12. Sk. No:4"
                  className="rounded-xl font-medium"
                />
              </Field>

              <Field className="col-span-2 sm:col-span-1">
                <FieldLabel htmlFor="st-city">Şehir / İl</FieldLabel>
                <Input
                  id="st-city"
                  value={form.city}
                  onChange={set("city")}
                  placeholder="Örn: İstanbul"
                  className="rounded-xl font-medium"
                />
              </Field>
            </div>

            {/* Sistem Rolü (Görev) & Bölge (Çalışma Alanı) */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sistem Rolü */}
                <Field>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="st-custom-role" className="text-xs font-bold text-foreground">
                      Sistem Rolü (Görevi)
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => setManageRolesOpen(true)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Settings2Icon className="size-3" />
                      Rolleri Düzenle
                    </button>
                  </div>
                  <Select
                    value={customRoleId}
                    onValueChange={(val) => {
                      if (!val) return;
                      if (val === "__MANAGE_ROLES__") {
                        setManageRolesOpen(true);
                      } else {
                        handleRoleChange(val);
                      }
                    }}
                  >
                    <SelectTrigger id="st-custom-role" className="rounded-xl font-semibold bg-background">
                      <div className="flex items-center gap-2 truncate">
                        <BriefcaseIcon className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {currentRole ? currentRole.name : "Sistem Rolü Seçin"}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{r.name}</span>
                            {r.isDefault && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                Varsayılan
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      <div className="border-t border-border/60 my-1 pt-1">
                        <SelectItem
                          value="__MANAGE_ROLES__"
                          className="text-primary font-bold focus:text-primary focus:bg-primary/10 cursor-pointer"
                        >
                          ⚙️ Sistem Rollerini Düzenle / Yeni Ekle...
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                </Field>

                {/* Bölge */}
                <Field>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="st-zone" className="text-xs font-bold text-foreground">
                      Çalışma Bölgesi
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => setManageZonesOpen(true)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Settings2Icon className="size-3" />
                      Bölgeleri Düzenle
                    </button>
                  </div>
                  <Select
                    value={zoneId}
                    onValueChange={(val) => {
                      if (!val) return;
                      if (val === "__MANAGE_ZONES__") {
                        setManageZonesOpen(true);
                      } else {
                        setZoneId(val);
                      }
                    }}
                  >
                    <SelectTrigger id="st-zone" className="rounded-xl font-semibold bg-background">
                      {(() => {
                        if (!currentZone) {
                          return (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPinIcon className="size-3.5 shrink-0" />
                              <span>Bölge Seçin</span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-2 font-semibold">
                            <span
                              className="size-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: currentZone.color || "#3B82F6" }}
                            />
                            <span className="truncate">{currentZone.name}</span>
                          </div>
                        );
                      })()}
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: z.color || "#3B82F6" }}
                            />
                            <span className="font-semibold">{z.name}</span>
                            {z.isDefault && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                Genel
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      <div className="border-t border-border/60 my-1 pt-1">
                        <SelectItem
                          value="__MANAGE_ZONES__"
                          className="text-primary font-bold focus:text-primary focus:bg-primary/10 cursor-pointer"
                        >
                          🏢 Bölgeleri Düzenle / Yeni Ekle...
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Hızlı Rol Seçimi Butonları */}
              {roles.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                    Hızlı Rol Seç:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {roles.slice(0, 8).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleChange(r.id)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
                          customRoleId === r.id
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        )}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ekran & Menü Yetkileri (Kategorize Matris) */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 sm:p-4 flex flex-col gap-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4.5 text-primary shrink-0" />
                  <div>
                    <span className="text-sm font-black text-foreground block">
                      Görüntülenecek Ekran & Menü Yetkileri
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {allowedRoutes.length} / {ALL_PERMISSION_ROUTE_IDS.length} Ekran Seçili
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllowedRoutes([...ALL_PERMISSION_ROUTE_IDS])}
                    className="text-xs font-bold text-primary hover:underline px-2.5 py-1 rounded-lg bg-primary/10 cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllowedRoutes([])}
                    className="text-xs font-bold text-destructive hover:underline px-2.5 py-1 rounded-lg bg-destructive/10 cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kullanıcı veya personel giriş yaptığında sadece tikli olan ekranlar görünür ve erişilebilir olur. Yetkilendirilmeyen diğer tüm ekranlar ve menü butonları tamamen gizlenir.
              </p>

              <div className="flex flex-col gap-3.5 pt-1">
                {PERMISSION_MATRIX_GROUPS.map((group) => {
                  const GroupIcon = group.icon;
                  const groupItemIds = group.items.map((i) => i.id);
                  const selectedCountInGroup = groupItemIds.filter((id) => allowedRoutes.includes(id)).length;
                  const isAllGroupSelected = selectedCountInGroup === groupItemIds.length;

                  return (
                    <div
                      key={group.id}
                      className="rounded-xl border border-border/70 bg-background/80 p-3 flex flex-col gap-2.5 shadow-2xs"
                    >
                      {/* Grup Başlığı */}
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2">
                          <GroupIcon className="size-4 text-primary shrink-0" />
                          <div>
                            <span className="text-xs font-black text-foreground">
                              {group.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">
                              {group.desc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            selectedCountInGroup > 0
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}>
                            {selectedCountInGroup}/{groupItemIds.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleGroup(groupItemIds)}
                            className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            {isAllGroupSelected ? "Kaldır" : "Grup Tümünü Seç"}
                          </button>
                        </div>
                      </div>

                      {/* Grup İçi Kartlar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const isSelected = allowedRoutes.includes(item.id);
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleRoute(item.id)}
                              className={cn(
                                "flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none text-left",
                                isSelected
                                  ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                                  : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex size-4.5 items-center justify-center rounded-md border shrink-0 mt-0.5 transition-colors",
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-muted-foreground/30 bg-background"
                                )}
                              >
                                {isSelected && <CheckIcon className="size-3 stroke-[3]" />}
                              </div>
                              <ItemIcon
                                className={cn(
                                  "size-4 shrink-0 mt-0.5",
                                  isSelected ? "text-primary" : "text-muted-foreground"
                                )}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs truncate font-bold text-foreground">
                                  {item.title}
                                </div>
                                <div className="text-[10px] text-muted-foreground line-clamp-1">
                                  {item.desc}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Çalışma Durumu */}
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

            {/* Giriş PIN Kodu / Şifre */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="st-pin" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRoundIcon className="size-3.5 text-primary" />
                  <span>{staff ? "Giriş PIN Kodu / Şifre Değiştir (İsteğe Bağlı)" : "Giriş PIN Kodu / Şifresi (4 Haneli)"}</span>
                </FieldLabel>
                <span className="text-[11px] font-semibold text-muted-foreground">Sadece 4 rakam (0-9)</span>
              </div>
              <Input
                id="st-pin"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={staff ? "Mevcut PIN'i korumak için boş bırakın" : "•••• (Örn: 1234)"}
                className="rounded-xl font-bold tracking-widest text-center text-base bg-background"
                required={!staff}
              />
              <p className="text-muted-foreground text-[11px]">
                {staff
                  ? "Yeni bir 4 haneli PIN girerseniz personelin mevcut şifresi güncellenir."
                  : "Personel bu 4 haneli PIN ile sisteme ve terminal ekranlarına giriş yapacaktır."}
              </p>
            </div>

            {/* İletişim & Kişisel Bilgiler Accordion */}
            <div className="border-border/60 flex flex-col gap-3 border-t pt-3">
              <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                İsteğe Bağlı Ek Bilgiler
              </p>

              <Field>
                <FieldLabel htmlFor="st-email">E-posta</FieldLabel>
                <Input
                  id="st-email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="ad.soyad@ornek.com"
                  className="rounded-xl"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="st-gender">Cinsiyet</FieldLabel>
                  <Select
                    value={gender}
                    onValueChange={(v) => setGender((v || "") as Gender | "")}
                  >
                    <SelectTrigger id="st-gender" className="rounded-xl">
                      <span>
                        {GENDER_OPTIONS.find((o) => o.value === gender)?.label ??
                          "Seçilmedi"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="st-emp-type">İstihdam Türü</FieldLabel>
                  <Select
                    value={employmentType}
                    onValueChange={(v) =>
                      setEmploymentType((v || "") as EmploymentType | "")
                    }
                  >
                    <SelectTrigger id="st-emp-type" className="rounded-xl">
                      <span>
                        {EMPLOYMENT_TYPE_OPTIONS.find(
                          (o) => o.value === employmentType
                        )?.label ?? "Seçilmedi"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="st-dob">Doğum Tarihi</FieldLabel>
                  <Input
                    id="st-dob"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={set("dateOfBirth")}
                    className="rounded-xl"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="st-joining">İşe Giriş Tarihi</FieldLabel>
                  <Input
                    id="st-joining"
                    type="date"
                    value={form.joiningDate}
                    onChange={set("joiningDate")}
                    className="rounded-xl"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="st-emg-name">Acil Durum İletişim Kişisi</FieldLabel>
                  <Input
                    id="st-emg-name"
                    value={form.emergencyContactName}
                    onChange={set("emergencyContactName")}
                    placeholder="Yakını, Eşi, Ebeveyni"
                    className="rounded-xl"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="st-emg-phone">Acil Durum Telefonu</FieldLabel>
                  <Input
                    id="st-emg-phone"
                    value={form.emergencyContactPhone}
                    onChange={set("emergencyContactPhone")}
                    placeholder="05xx xxx xx xx"
                    className="rounded-xl"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="st-notes">Özel Notlar</FieldLabel>
                <Textarea
                  id="st-notes"
                  value={form.notes}
                  onChange={set("notes")}
                  placeholder="Personel hakkında özel notlar, sertifikalar veya çalışma tercihleri..."
                  className="rounded-xl resize-none"
                  rows={2}
                />
              </Field>
            </div>

            <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur-xs pt-3 pb-1 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={disabled}>
                {save.isPending
                  ? "Kaydediliyor…"
                  : staff
                    ? "Değişiklikleri Kaydet"
                    : "Personeli Ekle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Yönetim Modalları */}
      {manageRolesOpen && (
        <ManageStaffRolesDialog
          open={manageRolesOpen}
          onOpenChange={setManageRolesOpen}
          roles={roles}
          onRolesUpdated={loadRolesAndZones}
          onRoleSelected={(newId) => handleRoleChange(newId)}
        />
      )}

      {manageZonesOpen && (
        <ManageZonesDialog
          open={manageZonesOpen}
          onOpenChange={setManageZonesOpen}
          zones={zones}
          onZonesUpdated={loadRolesAndZones}
          onZoneSelected={(newId) => setZoneId(newId)}
        />
      )}
    </>
  );
}
