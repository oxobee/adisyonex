"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { QrCodeIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteTableAction } from "@/actions/table.actions";
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
import { groupTablesBySection } from "@/lib/tables";
import type { TableDTO } from "@/types/table";

import { TableDialog } from "./table-dialog";
import { TableShareDialog } from "./table-share-dialog";

export function TablesManager({
  tables,
  username,
  selfOrderEnabled,
}: {
  readonly tables: TableDTO[];
  readonly username: string;
  readonly selfOrderEnabled: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TableDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableDTO | null>(null);
  const [shareTarget, setShareTarget] = useState<TableDTO | null>(null);

  const del = useServerAction(deleteTableAction, {
    refresh: true,
    onSuccess: () => {
      toast.success("Masa kaldırıldı");
      setDeleteTarget(null);
    },
    onError: (message) => toast.error(message),
  });

  const openNew = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };
  const openEdit = (table: TableDTO) => {
    setEditTarget(table);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Masalar"
          description="Garsonların adisyon açabilmesi ve kat planını yönetebilmek için masalarınızı tanımlayın."
        />
        <Button onClick={openNew}>Masa Ekle</Button>
      </div>

      {tables.length === 0 ? (
        <EmptyState
          title="Henüz masa eklenmemiş"
          description="POS ekranında masaya sipariş alabilmek için masalarınızı ve bölümlerinizi (Salon, Bahçe vb.) ekleyin."
        />
      ) : (
        groupTablesBySection(tables).map(([section, rows]) => (
          <div key={section} className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-sm font-medium">{section}</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((table) => (
                <li
                  key={table.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {table.label}
                      {!table.isActive ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Pasif
                        </Badge>
                      ) : null}
                    </p>
                    {table.seats != null ? (
                      <p className="text-muted-foreground text-xs">
                        {table.seats} kişilik
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => setShareTarget(table)}
                    >
                      <QrCodeIcon className="size-4" />
                      QR Paylaş
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => openEdit(table)}
                    >
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive h-8 px-2 text-xs"
                      onClick={() => setDeleteTarget(table)}
                    >
                      Kaldır
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {dialogOpen ? (
        <TableDialog
          table={editTarget}
          onOpenChange={setDialogOpen}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {shareTarget ? (
        <TableShareDialog
          table={shareTarget}
          username={username}
          selfOrderEnabled={selfOrderEnabled}
          onOpenChange={(open) => !open && setShareTarget(null)}
        />
      ) : null}

      {deleteTarget ? (
        <Dialog open onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{deleteTarget.label} masasını kaldırmak istiyor musunuz?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Geçmiş sipariş kayıtları korunur. İleride bu masa adını tekrar ekleyebilirsiniz.
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
