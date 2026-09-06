"use client";

import { useState } from "react";
import {
  BriefcaseIcon,
  CheckIcon,
  Edit2Icon,
  InfoIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createStaffRoleAction,
  updateStaffRoleAction,
  deleteStaffRoleAction,
} from "@/actions/zone-and-role.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import type { RestaurantStaffRoleDTO } from "@/types/staff";

interface ManageStaffRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RestaurantStaffRoleDTO[];
  onRolesUpdated: () => void;
  onRoleSelected?: (roleId: string) => void;
}

export function ManageStaffRolesDialog({
  open,
  onOpenChange,
  roles,
  onRolesUpdated,
  onRoleSelected,
}: ManageStaffRolesDialogProps) {
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const startEdit = (role: RestaurantStaffRoleDTO) => {
    setEditingRoleId(role.id);
    setName(role.name);
    setDescription(role.description || "");
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingRoleId(null);
    setName("");
    setDescription("");
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Rol adı boş bırakılamaz.");
      return;
    }

    setLoading(true);
    try {
      if (editingRoleId) {
        const res = await updateStaffRoleAction({
          id: editingRoleId,
          name: name.trim(),
          description: description.trim() || undefined,
        });
        if (res.success) {
          toast.success("Sistem rolü güncellendi.");
          resetForm();
          onRolesUpdated();
        } else {
          toast.error(res.error || "Güncelleme başarısız.");
        }
      } else {
        const res = await createStaffRoleAction({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        if (res.success) {
          toast.success("Yeni sistem rolü eklendi.");
          if (onRoleSelected && res.data) {
            onRoleSelected(res.data.id);
          }
          resetForm();
          onRolesUpdated();
        } else {
          toast.error(res.error || "Rol eklenemedi.");
        }
      }
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (role: RestaurantStaffRoleDTO) => {
    if (role.isDefault || role.name.toLowerCase() === "diğer") {
      toast.error("Varsayılan 'Diğer' rolü silinemez.");
      return;
    }

    if (
      !confirm(
        `'${role.name}' rolünü silmek istediğinize emin misiniz?\n\nBu role atanmış tüm personeller otomatik olarak 'Diğer' rolüne aktarılacaktır.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await deleteStaffRoleAction({ id: role.id });
      if (res.success) {
        toast.success(
          `'${role.name}' rolü silindi. Personeller 'Diğer' rolüne aktarıldı.`
        );
        onRolesUpdated();
      } else {
        toast.error(res.error || "Rol silinemedi.");
      }
    } catch {
      toast.error("Silme işlemi başarısız.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BriefcaseIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Sistem Rolleri (Görevler)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Personellerinizin görev unvanlarını ekleyin, düzenleyin veya silin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Bilgilendirme Notu */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300">
          <InfoIcon className="size-4 shrink-0 mt-0.5" />
          <span>
            <strong>Otomatik Koruma:</strong> Herhangi bir rolü sildiğinizde, o role atanmış
            personelleriniz veri kaybı olmaksızın otomatik olarak <strong>&quot;Diğer&quot;</strong> rolüne
            aktarılır.
          </span>
        </div>

        {/* Form Alanı (Yeni Ekle veya Düzenle) */}
        {showAddForm ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">
                {editingRoleId ? "Rolü Düzenle" : "Yeni Sistem Rolü Ekle"}
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <Field>
              <FieldLabel htmlFor="role-name">Görev / Rol Adı</FieldLabel>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Aşçı, Barista, Komi, Paketçi..."
                className="rounded-xl font-bold bg-background"
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="role-desc">Açıklama (Opsiyonel)</FieldLabel>
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: Sıcak ve soğuk mutfak hazırlığı"
                className="rounded-xl bg-background text-xs"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-xs"
              >
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="text-xs">
                {editingRoleId ? "Güncelle" : "Rolü Kaydet"}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-dashed border-2 py-5 font-bold hover:bg-muted/50"
          >
            <PlusIcon className="size-4 text-primary" />
            <span>Yeni Sistem Rolü Ekle</span>
          </Button>
        )}

        {/* Rol Listesi */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            Mevcut Sistem Rolleri ({roles.length})
          </span>
          <div className="flex flex-col divide-y rounded-2xl border border-border/80 bg-muted/20 overflow-hidden">
            {roles.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground truncate">
                      {r.name}
                    </span>
                    {r.isDefault && (
                      <Badge variant="outline" className="text-[10px] bg-muted font-normal">
                        Varsayılan
                      </Badge>
                    )}
                  </div>
                  {r.description && (
                    <span className="text-xs text-muted-foreground truncate">
                      {r.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => startEdit(r)}
                    title="Düzenle"
                  >
                    <Edit2Icon className="size-3.5" />
                  </Button>

                  {!r.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => handleDelete(r)}
                      title="Sil"
                      disabled={loading}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
