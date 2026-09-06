"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  FilterIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { deleteStaffAction } from "@/actions/staff.actions";
import { ResetPinDialog } from "@/components/staff/reset-pin-dialog";
import { StaffDialog } from "@/components/staff/staff-dialog";
import { ManageStaffRolesDialog } from "@/components/staff/manage-staff-roles-dialog";
import { ManageZonesDialog } from "@/components/staff/manage-zones-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerAction } from "@/hooks/use-server-action";
import { staffStatusLabel } from "@/lib/staff";
import { cn } from "@/lib/utils";
import type {
  RestaurantStaffRoleDTO,
  RestaurantZoneDTO,
  StaffDTO,
  StaffStatus,
} from "@/types/staff";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const STATUS_STYLES: Record<StaffStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  ON_LEAVE: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  INACTIVE: "bg-muted text-muted-foreground",
};

function StaffRow({
  member,
  onEdit,
  onResetPin,
  onRemove,
}: {
  readonly member: StaffDTO;
  readonly onEdit: () => void;
  readonly onResetPin: () => void;
  readonly onRemove: () => void;
}) {
  const roleName = member.customRole?.name || member.jobTitle || member.role;
  const zoneName = member.zone?.name || "Genel";
  const zoneColor = member.zone?.color || "#6B7280";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors">
      <div className="flex min-w-0 items-center gap-3">
        <span className="ring-border bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-black ring-1">
          {member.photoUrl ? (
            <Image
              src={member.photoUrl}
              alt=""
              width={44}
              height={44}
              className="size-full object-cover"
            />
          ) : (
            initials(member.name)
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-foreground text-sm">
              {member.name}
            </span>

            {/* Sistem Rolü (Görev) Rozeti */}
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-bold">
              <BriefcaseIcon className="size-3" />
              {roleName}
            </span>

            {/* Bölge Rozeti */}
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
              <span
                className="size-2 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: zoneColor }}
              />
              {zoneName}
            </span>

            {/* Çalışma Durumu */}
            <Badge className={`text-[10px] font-bold ${STATUS_STYLES[member.status]}`}>
              {staffStatusLabel(member.status)}
            </Badge>
          </div>

          <p className="text-muted-foreground text-xs mt-1">
            <span className="font-mono font-bold text-foreground/80">
              {member.employeeCode}
            </span>
            {" · "}
            {member.phone}
            {member.hasPin ? " · PIN Tanımlı" : " · PIN Yok"}
            {member.allowedRoutes && member.allowedRoutes.length > 0
              ? ` · ${member.allowedRoutes.length} Ekran Yetkili`
              : " · Yetki Yok"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
          onClick={onEdit}
        >
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs font-semibold cursor-pointer"
          onClick={onResetPin}
        >
          PIN Sıfırla
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 h-8 px-2.5 text-xs font-semibold cursor-pointer"
          onClick={onRemove}
        >
          Kaldır
        </Button>
      </div>
    </li>
  );
}

export function StaffManager({
  staff,
  initialRoles = [],
  initialZones = [],
}: {
  readonly staff: StaffDTO[];
  readonly initialRoles?: RestaurantStaffRoleDTO[];
  readonly initialZones?: RestaurantZoneDTO[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [zonesDialogOpen, setZonesDialogOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<StaffDTO | null>(null);
  const [pinTarget, setPinTarget] = useState<StaffDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffDTO | null>(null);

  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const del = useServerAction(deleteStaffAction, {
    refresh: true,
    onSuccess: () => {
      toast.success("Personel kaldırıldı");
      setDeleteTarget(null);
    },
    onError: (message) => toast.error(message),
  });

  const refresh = () => router.refresh();

  const openNew = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (member: StaffDTO) => {
    setEditTarget(member);
    setDialogOpen(true);
  };

  // Filter staff based on zone, role and search query
  const filteredStaff = staff.filter((member) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = member.name.toLowerCase().includes(q);
      const matchCode = member.employeeCode.toLowerCase().includes(q);
      const matchPhone = member.phone.toLowerCase().includes(q);
      const matchRole = (member.customRole?.name || member.jobTitle || "").toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPhone && !matchRole) {
        return false;
      }
    }

    // Zone filter
    if (selectedZoneFilter !== "ALL") {
      if (member.zoneId !== selectedZoneFilter && member.zone?.name !== selectedZoneFilter) {
        return false;
      }
    }

    // Role filter
    if (selectedRoleFilter !== "ALL") {
      if (member.customRoleId !== selectedRoleFilter && member.customRole?.name !== selectedRoleFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Personel Yönetimi"
          description="Ekibinizin sistem rolleri (görevler), çalışma bölgeleri ve POS/Mutfak ekran yetkileri."
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRolesDialogOpen(true)}
            className="rounded-xl font-bold gap-1.5 cursor-pointer text-xs"
          >
            <BriefcaseIcon className="size-3.5 text-primary" />
            Rolleri Yönet
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setZonesDialogOpen(true)}
            className="rounded-xl font-bold gap-1.5 cursor-pointer text-xs"
          >
            <MapPinIcon className="size-3.5 text-primary" />
            Bölgeleri Yönet
          </Button>

          <Button
            onClick={openNew}
            size="sm"
            className="rounded-xl font-bold gap-1.5 cursor-pointer text-xs"
          >
            <PlusIcon className="size-4" />
            Personel Ekle
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-muted/20 p-3 rounded-2xl border border-border/80">
        <div className="relative flex-1">
          <SearchIcon className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Personel adı, kodu veya telefon ile ara..."
            className="pl-9 rounded-xl bg-background text-xs"
          />
        </div>

        {/* Bölge Filtresi Butonları */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
            <FilterIcon className="size-3" />
            Bölge:
          </span>
          <button
            type="button"
            onClick={() => setSelectedZoneFilter("ALL")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer",
              selectedZoneFilter === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Tümü ({staff.length})
          </button>
          {initialZones.map((zone) => {
            const count = staff.filter(
              (s) => s.zoneId === zone.id || s.zone?.name === zone.name
            ).length;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneFilter(zone.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer",
                  selectedZoneFilter === zone.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: zone.color || "#3B82F6" }}
                />
                <span>{zone.name}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff List */}
      {staff.length === 0 ? (
        <EmptyState
          title="Henüz personel eklenmemiş"
          description="Garson, aşçı, kasiyer ve yönetim ekibinizi ekleyerek POS, mutfak ve masalarda yetkilendirin."
        />
      ) : filteredStaff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed p-6">
          <UsersIcon className="size-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-bold text-foreground">Arama kriterlerine uygun personel bulunamadı.</p>
          <p className="text-xs text-muted-foreground mt-1">Filtreleri sıfırlayarak tekrar deneyebilirsiniz.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedZoneFilter("ALL");
              setSelectedRoleFilter("ALL");
            }}
            className="mt-3 text-xs text-primary font-bold"
          >
            Filtreleri Temizle
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-2xl border border-border/80 bg-background overflow-hidden shadow-xs">
          <ul className="divide-y divide-border/60">
            {filteredStaff.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                onEdit={() => openEdit(member)}
                onResetPin={() => setPinTarget(member)}
                onRemove={() => setDeleteTarget(member)}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Personel Ekle / Düzenle Dialog */}
      {dialogOpen ? (
        <StaffDialog
          staff={editTarget}
          onOpenChange={setDialogOpen}
          onSaved={refresh}
        />
      ) : null}

      {/* Sistem Rollerini Yönet Dialog */}
      {rolesDialogOpen && (
        <ManageStaffRolesDialog
          open={rolesDialogOpen}
          onOpenChange={setRolesDialogOpen}
          roles={initialRoles}
          onRolesUpdated={refresh}
        />
      )}

      {/* Bölgeleri Yönet Dialog */}
      {zonesDialogOpen && (
        <ManageZonesDialog
          open={zonesDialogOpen}
          onOpenChange={setZonesDialogOpen}
          zones={initialZones}
          onZonesUpdated={refresh}
        />
      )}

      {/* PIN Sıfırla Dialog */}
      {pinTarget ? (
        <ResetPinDialog
          staff={pinTarget}
          onOpenChange={(open) => !open && setPinTarget(null)}
          onSaved={refresh}
        />
      ) : null}

      {/* Silme Onay Dialog */}
      {deleteTarget ? (
        <Dialog open onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-black text-foreground">
                {deleteTarget.name} personelini kaldırmak istiyor musunuz?
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Bu personel listeden kaldırılacak ve POS / Mutfak giriş yetkisi iptal edilecektir.
              İleride aynı kod ile yeniden aktifleştirebilirsiniz.
            </p>
            <DialogFooter className="gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                disabled={del.isPending}
                onClick={() => del.execute({ id: deleteTarget.id })}
              >
                {del.isPending ? "Kaldırılıyor…" : "Kaldır"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
