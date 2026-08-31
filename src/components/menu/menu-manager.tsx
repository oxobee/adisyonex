"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"

import {
  BadgeCheckIcon,
  CopyIcon,
  FolderPlusIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import Image from "next/image"

import {
  deleteCategoryAction,
  deleteItemAction,
  duplicateItemAction,
  reenableItemAction,
} from "@/actions/menu.actions"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/sonner"
import { useServerAction } from "@/hooks/use-server-action"
import { cn } from "@/lib/utils"
import type {
  MenuCategoryDTO,
  MenuDTO,
  MenuItemDTO,
  MenuModifierGroupDTO,
} from "@/types/menu"
import type { RecipeComponentDTO, StockItemDTO } from "@/types/inventory"

import { formatCurrency } from "@/lib/format"
import { CategoryDialog } from "./category-dialog"
import { EightySixDialog } from "./eighty-six-dialog"
import { ItemDialog } from "./item-dialog"
import { ModifierGroupsDialog } from "./modifier-groups-dialog"
import { RecipeDialog } from "./recipe-dialog"

const money = (n: number) => formatCurrency(n)

const DIET_DOT: Record<string, string> = {
  VEG: "bg-emerald-600",
  NON_VEG: "bg-red-600",
  EGG: "bg-amber-500",
}

const REASON_LABEL: Record<string, string> = {
  OUT_OF_STOCK: "Stokta Yok",
  KITCHEN_CLOSING: "Mutfak Kapalı",
  CUSTOM: "Geçici Kapalı",
}

export function MenuManager({
  menu,
  groups,
  gstRegistered,
  stockItems,
  recipes,
}: {
  menu: MenuDTO
  groups: readonly MenuModifierGroupDTO[]
  gstRegistered: boolean
  stockItems: readonly StockItemDTO[]
  recipes: Record<string, readonly RecipeComponentDTO[]>
}) {
  const router = useRouter()
  const refresh = () => router.refresh()

  const [itemDialog, setItemDialog] = useState<{
    open: boolean
    item: MenuItemDTO | null
  }>({ open: false, item: null })
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean
    category: MenuCategoryDTO | null
  }>({ open: false, category: null })
  const [groupsOpen, setGroupsOpen] = useState(false)
  const [eightySix, setEightySix] = useState<{
    open: boolean
    item: MenuItemDTO | null
  }>({ open: false, item: null })
  const [recipeItem, setRecipeItem] = useState<MenuItemDTO | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<MenuItemDTO | null>(null)

  const deleteCategory = useServerAction(deleteCategoryAction, {
    onSuccess: () => {
      toast.success("Kategori silindi")
      refresh()
    },
    onError: (message) => toast.error(message),
  })
  const deleteItem = useServerAction(deleteItemAction, {
    onSuccess: () => {
      toast.success("Ürün silindi")
      refresh()
    },
    onError: (message) => toast.error(message),
  })
  const duplicateItem = useServerAction(duplicateItemAction, {
    onSuccess: (res) => {
      toast.success(`"${res?.name ?? "Ürün"}" kopyası başarıyla oluşturuldu!`)
      setDuplicateTarget(null)
      refresh()
    },
    onError: (message) => toast.error(message),
  })
  const reenable = useServerAction(reenableItemAction, {
    onSuccess: () => {
      toast.success("Ürün tekrar satışa açıldı")
      refresh()
    },
    onError: (message) => toast.error(message),
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Menü Yönetimi"
          description="Kategoriler, ürünler, fiyatlar, porsiyonlar, ekstralar ve stok durumu."
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setGroupsOpen(true)}>
            <SlidersHorizontalIcon className="size-4" /> Ekstra Seçenekler
          </Button>
          <Button
            variant="outline"
            onClick={() => setCategoryDialog({ open: true, category: null })}
          >
            <FolderPlusIcon className="size-4" /> Yeni Kategori
          </Button>
          <Button
            onClick={() => setItemDialog({ open: true, item: null })}
            disabled={menu.categories.length === 0}
          >
            <PlusIcon className="size-4" /> Yeni Ürün
          </Button>
        </div>
      </div>

      {menu.categories.length === 0 ? (
        <EmptyState
          title="Henüz kategori bulunmuyor"
          description="Ürün eklemeye başlamak için bir kategori (Örn: Başlangıçlar, Ana Yemekler) oluşturun."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {menu.categories.map((category) => {
            const items = menu.items.filter(
              (i) => i.categoryId === category.id,
            )
            return (
              <section key={category.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{category.name}</h2>
                    {!category.isActive ? (
                      <Badge variant="outline">Gizli</Badge>
                    ) : null}
                    <span className="text-muted-foreground text-sm">
                      ({items.length} ürün)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCategoryDialog({ open: true, category })
                      }
                    >
                      Düzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            `"${category.name}" kategorisini ve altındaki tüm ürünleri silmek istediğinize emin misiniz?`,
                          )
                        ) {
                          deleteCategory.execute({ id: category.id })
                        }
                      }}
                    >
                      Sil
                    </Button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 italic">
                    Bu kategoride henüz ürün bulunmuyor.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onEdit={() => setItemDialog({ open: true, item })}
                        onDuplicate={() => setDuplicateTarget(item)}
                        onDelete={() => {
                          if (window.confirm(`"${item.name}" ürününü silmek istediğinize emin misiniz?`)) {
                            deleteItem.execute({ id: item.id })
                          }
                        }}
                        on86={() => setEightySix({ open: true, item })}
                        onReenable={() =>
                          reenable.execute({ itemId: item.id })
                        }
                        onRecipe={() => setRecipeItem(item)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {categoryDialog.open ? (
        <CategoryDialog
          open
          category={categoryDialog.category}
          onOpenChange={(open) => setCategoryDialog((s) => ({ ...s, open }))}
          onSaved={refresh}
        />
      ) : null}
      {itemDialog.open ? (
        <ItemDialog
          open
          item={itemDialog.item}
          categories={menu.categories}
          groups={groups}
          gstRegistered={gstRegistered}
          onOpenChange={(open) => setItemDialog((s) => ({ ...s, open }))}
          onSaved={refresh}
        />
      ) : null}
      {eightySix.open ? (
        <EightySixDialog
          open
          item={eightySix.item}
          onOpenChange={(open) => setEightySix((s) => ({ ...s, open }))}
          onSaved={refresh}
        />
      ) : null}
      {groupsOpen ? (
        <ModifierGroupsDialog
          open
          groups={groups}
          onOpenChange={setGroupsOpen}
          onSaved={refresh}
        />
      ) : null}
      {recipeItem ? (
        <RecipeDialog
          item={recipeItem}
          components={recipes[recipeItem.id] ?? []}
          stockItems={stockItems}
          onOpenChange={(open) => !open && setRecipeItem(null)}
        />
      ) : null}

      {/* CUTE DUPLICATE CONFIRMATION POPUP */}
      {duplicateTarget ? (
        <Dialog open onOpenChange={(open) => !open && setDuplicateTarget(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-3xl shadow-inner">
                📋
              </div>
              <DialogTitle className="text-lg font-black text-foreground">
                Ürünü Çoğalt / Kopyala
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{duplicateTarget.name}</strong> ürününü tüm seçenekleri, alerjenleri, porsiyonları ve fiyatıyla kopyalamak istiyor musunuz?
              </DialogDescription>
            </div>

            <DialogFooter className="mt-4 flex flex-row gap-2 sm:justify-center">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl font-bold cursor-pointer"
                onClick={() => setDuplicateTarget(null)}
                disabled={duplicateItem.isPending}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 cursor-pointer"
                onClick={() => duplicateItem.execute({ id: duplicateTarget.id })}
                disabled={duplicateItem.isPending}
              >
                {duplicateItem.isPending ? "Kopyalanıyor…" : "📋 Evet, Kopyala"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      <Toaster />
    </div>
  )
}

function ItemCard({
  item,
  onEdit,
  onDuplicate,
  onDelete,
  on86,
  onReenable,
  onRecipe,
}: {
  item: MenuItemDTO
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  on86: () => void
  onReenable: () => void
  onRecipe: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex gap-3">
        {item.images[0] ? (
          <div className="bg-muted relative size-16 shrink-0 aspect-square overflow-hidden rounded-md border">
            <Image
              src={item.images[0].url}
              alt={item.name}
              fill
              className="object-cover object-center"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground flex size-16 shrink-0 aspect-square items-center justify-center rounded-md border">
            <ImageIcon className="size-5" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1.5">
            {item.dietaryType ? (
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  DIET_DOT[item.dietaryType],
                )}
                aria-hidden
              />
            ) : null}
            <span className="truncate font-medium">{item.name}</span>
          </div>
          <span className="text-sm">{item.price} ₺</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {item.available ? (
              <Badge variant="outline" className="gap-1 text-green-700">
                <BadgeCheckIcon className="size-3" /> Satışta
              </Badge>
            ) : (
              <Badge variant="destructive">
                Tükendi
                {item.disabledReason
                  ? ` · ${REASON_LABEL[item.disabledReason] ?? "Kapalı"}`
                  : ""}
              </Badge>
            )}
            <Badge variant="secondary">
              {item.tax.kind === "NONE" ? "KDV Yok" : `KDV %${item.tax.rate}`}
            </Badge>
            {item.variants.length ? (
              <Badge variant="outline">{item.variants.length} seçenek</Badge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-1">
        {item.available ? (
          <Button variant="ghost" size="sm" onClick={on86}>
            Tükendi İşaretle
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onReenable}>
            Tekrar Satışa Aç
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onRecipe}>
          Reçete
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Ürünü Kopyala / Çoğalt"
          aria-label="Ürünü kopyala"
          onClick={onDuplicate}
        >
          <CopyIcon className="size-4 text-amber-600 dark:text-amber-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Ürünü Düzenle"
          aria-label="Ürünü düzenle"
          onClick={onEdit}
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Ürünü Sil"
          aria-label="Ürünü sil"
          onClick={onDelete}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
