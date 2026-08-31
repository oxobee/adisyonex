"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BriefcaseIcon,
  HeadphonesIcon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  PowerIcon,
  StoreIcon,
  Trash2Icon,
  UserCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteSalesRepAction,
  updateSalesRepAction,
} from "@/actions/sales-rep.actions";
import { SalesRepDialog } from "@/components/admin/sales-rep-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";
import type { SalesRepDTO } from "@/services/sales-rep.service";

export function SalesRepsView({
  salesReps,
}: {
  readonly salesReps: readonly SalesRepDTO[];
}) {
  const router = useRouter();
  const [selectedRep, setSelectedRep] = useState<SalesRepDTO | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteRep, setDeleteRep] = useState<SalesRepDTO | null>(null);

  const toggleActiveAction = useServerAction(updateSalesRepAction, {
    onSuccess: () => {
      toast.success("Temsilci durumu güncellendi.");
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  const deleteAction = useServerAction(deleteSalesRepAction, {
    onSuccess: () => {
      toast.success("Satış temsilcisi başarıyla silindi.");
      setDeleteRep(null);
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-foreground">
            Kayıtlı Satış Temsilcileri ({salesReps.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Müşterilere atanan temsilciler, lisans bitiş ekranında ve restoran ayarlarında görüntülenir.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedRep(null);
            setIsDialogOpen(true);
          }}
          className="rounded-2xl font-bold shadow-md cursor-pointer"
        >
          <PlusIcon className="size-4 mr-1.5" />
          Yeni Temsilci Ekle
        </Button>
      </div>

      {/* Grid of Sales Rep Cards */}
      {salesReps.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <HeadphonesIcon className="size-7" />
          </div>
          <h3 className="text-base font-black text-foreground">Henüz satış temsilcisi eklenmemiş</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Yeni bir satış temsilcisi tanımlayarak restoranlara özel müşteri ve lisans danışmanı atayabilirsiniz.
          </p>
          <Button
            onClick={() => {
              setSelectedRep(null);
              setIsDialogOpen(true);
            }}
            className="mt-4 rounded-xl font-bold"
          >
            <PlusIcon className="size-4 mr-1.5" />
            İlk Temsilciyi Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {salesReps.map((rep) => {
            const initials =
              rep.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "ST";

            return (
              <div
                key={rep.id}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card p-5 shadow-md transition-all hover:shadow-lg",
                  rep.isActive ? "border-border/80" : "border-border/40 opacity-75",
                )}
              >
                <div>
                  {/* Card Header: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-xs">
                        {rep.photoUrl ? (
                          <Image
                            src={rep.photoUrl}
                            alt={rep.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Avatar className="size-full rounded-2xl">
                            <AvatarFallback className="rounded-2xl text-base font-black text-primary bg-primary/10">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-base text-foreground leading-tight truncate">
                          {rep.name}
                        </h4>
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary mt-0.5 truncate">
                          <BriefcaseIcon className="size-3 shrink-0" />
                          {rep.title}
                        </span>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0",
                        rep.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {rep.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>

                  {/* Assigned Restaurants Count */}
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-3.5 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                      <StoreIcon className="size-3.5 text-primary" />
                      Atanmış Restoranlar
                    </span>
                    <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-xs font-black tabular-nums">
                      {rep.assignedCount || 0} Restoran
                    </span>
                  </div>

                  {/* Contact Info Badges */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {rep.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PhoneIcon className="size-3.5 text-blue-500 shrink-0" />
                        <span className="font-mono font-medium text-foreground truncate">{rep.phone}</span>
                      </div>
                    )}
                    {rep.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MailIcon className="size-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium text-foreground truncate">{rep.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 flex items-center justify-end gap-1.5 pt-3 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toggleActiveAction.execute({ id: rep.id, data: { isActive: !rep.isActive } })
                    }
                    className={cn(
                      "rounded-xl text-xs font-bold",
                      rep.isActive ? "text-amber-600 hover:bg-amber-500/10" : "text-emerald-600 hover:bg-emerald-500/10",
                    )}
                    title={rep.isActive ? "Pasife Al" : "Aktif Yap"}
                  >
                    <PowerIcon className="size-3.5 mr-1" />
                    {rep.isActive ? "Pasif" : "Aktif"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRep(rep);
                      setIsDialogOpen(true);
                    }}
                    className="rounded-xl text-xs font-bold"
                  >
                    <PencilIcon className="size-3.5 mr-1" />
                    Düzenle
                  </Button>

                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setDeleteRep(rep)}
                    className="text-destructive hover:bg-destructive/10 rounded-xl"
                    title="Sil"
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Dialog */}
      <SalesRepDialog
        salesRep={selectedRep}
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedRep(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deleteRep && (
        <Dialog open={!!deleteRep} onOpenChange={(open) => !open && setDeleteRep(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-destructive text-xl font-black">
                Temsilciyi Sil
              </DialogTitle>
              <DialogDescription>
                <strong>{deleteRep.name}</strong> isimli satış temsilcisini silmek istediğinize emin misiniz? Atanmış restoranların temsilci bağı kaldırılacaktır.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteRep(null)}
                className="rounded-xl"
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                disabled={deleteAction.isPending}
                onClick={() => deleteAction.execute({ id: deleteRep.id })}
                className="rounded-xl font-black"
              >
                {deleteAction.isPending ? "Siliniyor..." : "Evet, Sil"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
