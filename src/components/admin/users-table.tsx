"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  HeadphonesIcon,
  PencilIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteAdminUserAction,
  toggleSuspendAdminUserAction,
  updateAdminUserAction,
} from "@/actions/admin-management.actions";
import { AssignSalesRepToUserDialog } from "@/components/admin/assign-sales-rep-to-user-dialog";
import { EmptyState } from "@/components/shared/empty-state";
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
import { useServerAction } from "@/hooks/use-server-action";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types";
import type { AdminUserListItemDTO } from "@/types/admin";
import type { SalesRepDTO } from "@/services/sales-rep.service";

const ROLE_LABEL: Record<AdminUserListItemDTO["role"], string> = {
  MANAGER: "İşletmeci / Müdür",
  ADMIN: "Yönetici",
  SUPER_ADMIN: "Süper Yönetici",
};

const STATUS_CLASS: Record<AdminUserListItemDTO["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  suspended: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  deleted: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABEL: Record<AdminUserListItemDTO["status"], string> = {
  active: "Aktif",
  suspended: "Askıya Alındı",
  deleted: "Silindi",
};

export function UsersTable({
  data,
  salesReps = [],
}: {
  readonly data: Paginated<AdminUserListItemDTO>;
  readonly salesReps?: readonly SalesRepDTO[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [detailUser, setDetailUser] = useState<AdminUserListItemDTO | null>(null);
  const [editUser, setEditUser] = useState<AdminUserListItemDTO | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserListItemDTO | null>(null);
  const [assignRepUser, setAssignRepUser] = useState<AdminUserListItemDTO | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<AdminUserListItemDTO["role"]>("MANAGER");

  const openEdit = (user: AdminUserListItemDTO) => {
    setEditUser(user);
    setEditName(user.name ?? "");
    setEditEmail(user.email ?? "");
    setEditRole(user.role);
  };

  const updateAction = useServerAction(updateAdminUserAction, {
    onSuccess: () => {
      toast.success("Kullanıcı bilgileri güncellendi");
      setEditUser(null);
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  const toggleSuspendAction = useServerAction(toggleSuspendAdminUserAction, {
    onSuccess: () => {
      toast.success("Kullanıcı durumu güncellendi");
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  const deleteAction = useServerAction(deleteAdminUserAction, {
    onSuccess: () => {
      toast.success("Kullanıcı başarıyla silindi");
      setDeleteUser(null);
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data.items;
    return data.items.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }, [data.items, search]);

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="Henüz kullanıcı bulunmuyor"
        description="İlk yönetici hesabını oluşturmak için bir restoran kaydedin."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, telefon veya e-posta ile ara…"
            className="pl-9"
          />
        </div>
        <div className="text-muted-foreground text-xs">
          {filteredItems.length} kullanıcı gösteriliyor
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Ad Soyad</th>
                <th className="px-4 py-3 text-left font-medium">Telefon / E-posta</th>
                <th className="px-4 py-3 text-left font-medium">Rol</th>
                <th className="px-4 py-3 text-left font-medium">Durum</th>
                <th className="px-4 py-3 text-center font-medium">Restoran</th>
                <th className="px-4 py-3 text-right font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {(user.name ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{user.name ?? "İsimsiz"}</div>
                        <div className="text-muted-foreground text-xs">
                          Kayıt: {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{user.phone}</div>
                    {user.email ? (
                      <div className="text-muted-foreground text-xs">{user.email}</div>
                    ) : null}
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => setAssignRepUser(user)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer",
                          user.salesRepName
                            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            : "bg-muted text-muted-foreground border-border hover:bg-accent",
                        )}
                        title="Yetkili Satış Temsilcisi Ata / Değiştir"
                      >
                        <HeadphonesIcon className="size-2.5" />
                        <span className="truncate max-w-[120px]">{user.salesRepName || "Temsilci Ata"}</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium">
                      {user.role === "SUPER_ADMIN" ? (
                        <ShieldAlertIcon className="size-3 text-amber-500" />
                      ) : user.role === "ADMIN" ? (
                        <ShieldCheckIcon className="size-3 text-blue-500" />
                      ) : null}
                      {ROLE_LABEL[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        STATUS_CLASS[user.status],
                      )}
                    >
                      {STATUS_LABEL[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">
                    <span className="bg-muted inline-flex size-6 items-center justify-center rounded-full text-xs font-medium">
                      {user.restaurantCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title="Yetkili Temsilci Ata"
                        className="text-primary hover:bg-primary/10"
                        onClick={() => setAssignRepUser(user)}
                      >
                        <HeadphonesIcon className="size-4" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title="Detay Görüntüle"
                        onClick={() => setDetailUser(user)}
                      >
                        <EyeIcon className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title="Düzenle"
                        onClick={() => openEdit(user)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title={user.status === "suspended" ? "Hesabı Aç" : "Askıya Al"}
                        className={user.status === "suspended" ? "text-emerald-600" : "text-amber-600"}
                        onClick={() => toggleSuspendAction.execute({ id: user.id })}
                      >
                        {user.status === "suspended" ? (
                          <UserCheckIcon className="size-3.5" />
                        ) : (
                          <UserXIcon className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title="Sil"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteUser(user)}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DIALOG */}
      {detailUser ? (
        <Dialog open onOpenChange={(open) => !open && setDetailUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kullanıcı Detayları</DialogTitle>
              <DialogDescription>
                {detailUser.name ?? "Kullanıcı"} profili ve sistem kayıtları
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Kullanıcı ID:</span>
                <span className="font-mono text-xs">{detailUser.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Ad Soyad:</span>
                <span className="font-medium">{detailUser.name ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Telefon:</span>
                <span className="font-mono">{detailUser.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">E-posta:</span>
                <span>{detailUser.email ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Kullanıcı Rolü:</span>
                <span className="font-medium">{ROLE_LABEL[detailUser.role]}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Durum:</span>
                <span className={cn("font-medium", STATUS_CLASS[detailUser.status])}>
                  {STATUS_LABEL[detailUser.status]}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Sahip Olduğu Restoranlar:</span>
                <span className="font-bold">{detailUser.restaurantCount} Adet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kayıt Tarihi:</span>
                <span>{formatDate(detailUser.createdAt)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailUser(null)}>
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* EDIT DIALOG */}
      {editUser ? (
        <Dialog open onOpenChange={(open) => !open && setEditUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
              <DialogDescription>
                {editUser.phone} numaralı kullanıcının bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateAction.execute({
                  id: editUser.id,
                  name: editName,
                  email: editEmail || null,
                  role: editRole,
                });
              }}
              className="flex flex-col gap-4 py-2"
            >
              <Field>
                <FieldLabel htmlFor="edit-name">Ad Soyad</FieldLabel>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Örn. Ahmet Yılmaz"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-email">E-posta Adresi (İsteğe Bağlı)</FieldLabel>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="ahmet@ornek.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-role">Yetki / Rol</FieldLabel>
                <select
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AdminUserListItemDTO["role"])}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="MANAGER">İşletmeci / Müdür (MANAGER)</option>
                  <option value="ADMIN">Yönetici (ADMIN)</option>
                  <option value="SUPER_ADMIN">Süper Yönetici (SUPER_ADMIN)</option>
                </select>
              </Field>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                  İptal
                </Button>
                <Button type="submit" disabled={updateAction.isPending}>
                  {updateAction.isPending ? "Kaydediliyor…" : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* DELETE DIALOG */}
      {deleteUser ? (
        <Dialog open onOpenChange={(open) => !open && setDeleteUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">Kullanıcıyı Sil</DialogTitle>
              <DialogDescription>
                <strong>{deleteUser.name ?? deleteUser.phone}</strong> kullanıcısını silmek istediğinize emin misiniz? Bu işlem kullanıcının erişimini sonlandırır.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteUser(null)}>
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                disabled={deleteAction.isPending}
                onClick={() => deleteAction.execute({ id: deleteUser.id })}
              >
                {deleteAction.isPending ? "Siliniyor…" : "Evet, Sil"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* ASSIGN SALES REPRESENTATIVE TO USER DIALOG */}
      <AssignSalesRepToUserDialog
        user={assignRepUser}
        salesReps={salesReps}
        onOpenChange={(open) => !open && setAssignRepUser(null)}
      />
    </div>
  );
}
