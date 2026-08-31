"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLinkIcon,
  EyeIcon,
  PencilIcon,
  PowerIcon,
  SearchIcon,
  Trash2Icon,
  UtensilsIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteAdminRestaurantAction,
  toggleAdminRestaurantActiveAction,
  updateAdminRestaurantAction,
} from "@/actions/admin-management.actions";
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
import type { RestaurantListItemDTO } from "@/types/admin";

export function RestaurantsTable({
  data,
}: {
  readonly data: Paginated<RestaurantListItemDTO>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [detailRestaurant, setDetailRestaurant] = useState<RestaurantListItemDTO | null>(null);
  const [editRestaurant, setEditRestaurant] = useState<RestaurantListItemDTO | null>(null);
  const [deleteRestaurant, setDeleteRestaurant] = useState<RestaurantListItemDTO | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const openEdit = (res: RestaurantListItemDTO) => {
    setEditRestaurant(res);
    setEditName(res.name);
    setEditSlug(res.slug);
    setEditUsername(res.username ?? "");
    setEditPhone(res.phone ?? "");
    setEditEmail(res.email ?? "");
    setEditCity(res.city ?? "");
    setEditAddress(res.addressLine1 ?? "");
  };

  const updateAction = useServerAction(updateAdminRestaurantAction, {
    onSuccess: () => {
      toast.success("Restoran bilgileri güncellendi");
      setEditRestaurant(null);
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  const toggleActiveAction = useServerAction(toggleAdminRestaurantActiveAction, {
    onSuccess: () => {
      toast.success("Restoran durumu güncellendi");
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  const deleteAction = useServerAction(deleteAdminRestaurantAction, {
    onSuccess: () => {
      toast.success("Restoran başarıyla silindi");
      setDeleteRestaurant(null);
      router.refresh();
    },
    onError: (err) => toast.error(err),
  });

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return data.items;
    return data.items.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
        r.ownerPhone.toLowerCase().includes(q),
    );
  }, [data.items, search]);

  if (data.items.length === 0) {
    return (
      <EmptyState
        title="Henüz restoran bulunmuyor"
        description="Başlamak için ilk restoranınızı sisteme ekleyin."
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
            placeholder="Restoran adı, slug veya şehir ile ara…"
            className="pl-9"
          />
        </div>
        <div className="text-muted-foreground text-xs">
          {filteredItems.length} restoran gösteriliyor
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Restoran</th>
                <th className="px-4 py-3 text-left font-medium">İşletmeci Sahip</th>
                <th className="px-4 py-3 text-left font-medium">Konum</th>
                <th className="px-4 py-3 text-left font-medium">Durum</th>
                <th className="px-4 py-3 text-right font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                        <UtensilsIcon className="size-4" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{restaurant.name}</div>
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          <span>/{restaurant.slug}</span>
                          {restaurant.username ? (
                            <Link
                              href={`/order/${restaurant.username}`}
                              target="_blank"
                              className="text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              QR Menü <ExternalLinkIcon className="size-2.5" />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{restaurant.ownerName ?? "—"}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {restaurant.ownerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{restaurant.city || "—"}</div>
                    <div className="text-xs">{restaurant.country}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        restaurant.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border",
                      )}
                    >
                      {restaurant.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title="Detay Görüntüle"
                        onClick={() => setDetailRestaurant(restaurant)}
                      >
                        <EyeIcon className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title="Düzenle"
                        onClick={() => openEdit(restaurant)}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title={restaurant.isActive ? "Pasif Yap" : "Aktif Yap"}
                        className={restaurant.isActive ? "text-amber-600" : "text-emerald-600"}
                        onClick={() => toggleActiveAction.execute({ id: restaurant.id })}
                      >
                        <PowerIcon className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        title="Sil"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteRestaurant(restaurant)}
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
      {detailRestaurant ? (
        <Dialog open onOpenChange={(open) => !open && setDetailRestaurant(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Restoran Detayları</DialogTitle>
              <DialogDescription>
                {detailRestaurant.name} işletme ve sistem kayıtları
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Restoran ID:</span>
                <span className="font-mono text-xs">{detailRestaurant.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Restoran Adı:</span>
                <span className="font-medium">{detailRestaurant.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Slug / URL:</span>
                <span className="font-mono text-xs">/{detailRestaurant.slug}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Kullanıcı Adı / QR:</span>
                <span className="font-mono text-xs">{detailRestaurant.username ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">İşletmeci:</span>
                <span className="font-medium">{detailRestaurant.ownerName ?? "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">İşletmeci Telefon:</span>
                <span className="font-mono">{detailRestaurant.ownerPhone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Şehir / Ülke:</span>
                <span>{[detailRestaurant.city, detailRestaurant.country].filter(Boolean).join(", ")}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Adres:</span>
                <span>{detailRestaurant.addressLine1 || "—"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Durum:</span>
                <span className={detailRestaurant.isActive ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                  {detailRestaurant.isActive ? "Aktif" : "Pasif"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kayıt Tarihi:</span>
                <span>{formatDate(detailRestaurant.onboardedAt)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailRestaurant(null)}>
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* EDIT DIALOG */}
      {editRestaurant ? (
        <Dialog open onOpenChange={(open) => !open && setEditRestaurant(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Restoranı Düzenle</DialogTitle>
              <DialogDescription>
                {editRestaurant.name} bilgilerini güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateAction.execute({
                  id: editRestaurant.id,
                  name: editName,
                  slug: editSlug,
                  username: editUsername || null,
                  phone: editPhone || null,
                  email: editEmail || null,
                  city: editCity || null,
                  addressLine1: editAddress || null,
                });
              }}
              className="flex flex-col gap-4 py-2"
            >
              <Field>
                <FieldLabel htmlFor="edit-res-name">Restoran Adı</FieldLabel>
                <Input
                  id="edit-res-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Örn. Ugur Burger"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-res-slug">Sistem Slug (URL Kısaltması)</FieldLabel>
                <Input
                  id="edit-res-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  placeholder="ugur-burger"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="edit-res-username">QR Menü Kullanıcı Adı</FieldLabel>
                <Input
                  id="edit-res-username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="ugurburger"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="edit-res-phone">İletişim Telefon</FieldLabel>
                  <Input
                    id="edit-res-phone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+90 555..."
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-res-city">Şehir</FieldLabel>
                  <Input
                    id="edit-res-city"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="İstanbul"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="edit-res-address">Adres</FieldLabel>
                <Input
                  id="edit-res-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Mahalle, Cadde No..."
                />
              </Field>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditRestaurant(null)}>
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
      {deleteRestaurant ? (
        <Dialog open onOpenChange={(open) => !open && setDeleteRestaurant(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">Restoranı Sil</DialogTitle>
              <DialogDescription>
                <strong>{deleteRestaurant.name}</strong> restoranını silmek istediğinize emin misiniz? Bu işlem restoranı arşivler ve erişimini kapatır.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteRestaurant(null)}>
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                disabled={deleteAction.isPending}
                onClick={() => deleteAction.execute({ id: deleteRestaurant.id })}
              >
                {deleteAction.isPending ? "Siliniyor…" : "Evet, Sil"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
