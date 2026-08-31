"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { deleteStaffAction } from "@/actions/staff.actions";
import { ResetPinDialog } from "@/components/staff/reset-pin-dialog";
import { StaffDialog } from "@/components/staff/staff-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerAction } from "@/hooks/use-server-action";
import { STAFF_ROLE_OPTIONS, staffStatusLabel } from "@/lib/staff";
import type { StaffDTO, StaffStatus } from "@/types/staff";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const STATUS_STYLES: Record<StaffStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  ON_LEAVE: "bg-amber-100 text-amber-800",
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
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="ring-border bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold ring-1">
          {member.photoUrl ? (
            <Image
              src={member.photoUrl}
              alt=""
              width={40}
              height={40}
              className="size-full object-cover"
            />
          ) : (
            initials(member.name)
          )}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            {member.name}
            <Badge className={`text-[10px] ${STATUS_STYLES[member.status]}`}>
              {staffStatusLabel(member.status)}
            </Badge>
          </p>
          <p className="text-muted-foreground text-xs">
            {member.employeeCode} · {member.phone}
            {member.hasPin ? " · PIN Tanımlı" : " · PIN Yok"}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={onEdit}
        >
          Düzenle
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={onResetPin}
        >
          PIN Sıfırla
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive h-8 px-2 text-xs"
          onClick={onRemove}
        >
          Kaldır
        </Button>
      </div>
    </li>
  );
}

export function StaffManager({ staff }: { readonly staff: StaffDTO[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffDTO | null>(null);
  const [pinTarget, setPinTarget] = useState<StaffDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffDTO | null>(null);

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

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Personel Yönetimi"
          description="Ekibiniz — roller, iletişim bilgileri, salon ve mutfak POS PIN kodları."
        />
        <Button onClick={openNew}>Personel Ekle</Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          title="Henüz personel eklenmemiş"
          description="Garson, mutfak ve yönetim ekibinizi ekleyerek POS ve mutfak ekranlarında yetkilendirin."
        />
      ) : (
        STAFF_ROLE_OPTIONS.map((role) => {
          const rows = staff.filter((member) => member.role === role.value);
          if (rows.length === 0) {
            return null;
          }
          return (
            <div key={role.value} className="flex flex-col gap-2">
              <h2 className="text-muted-foreground text-sm font-medium">
                {role.label}{" "}
                <span className="text-muted-foreground/60">({rows.length} kişi)</span>
              </h2>
              <ul className="divide-y rounded-lg border">
                {rows.map((member) => (
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
          );
        })
      )}

      {dialogOpen ? (
        <StaffDialog
          staff={editTarget}
          onOpenChange={setDialogOpen}
          onSaved={refresh}
        />
      ) : null}
      {pinTarget ? (
        <ResetPinDialog
          staff={pinTarget}
          onOpenChange={(open) => !open && setPinTarget(null)}
          onSaved={refresh}
        />
      ) : null}
      {deleteTarget ? (
        <Dialog open onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{deleteTarget.name} personelini kaldırmak istiyor musunuz?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Artık personel listesinde görünmeyecek. İleride aynı personel koduyla tekrar ekleyebilirsiniz.
            </p>
            <DialogFooter>
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
