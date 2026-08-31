"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"

import {
  BadgeCheckIcon,
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
  reenableItemAction,
} from "@/actions/menu.actions"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

import { CategoryDialog } from "./category-dialog"
import { EightySixDialog } from "./eighty-six-dialog"
import { ItemDialog } from "./item-dialog"
import { ModifierGroupsDialog } from "./modifier-groups-dialog"
import { RecipeDialog } from "./recipe-dialog"

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n)

const DIET_DOT: Record<string, string> = {
  VEG: "bg-green-600",
  NON_VEG: "bg-red-600",
  EGG: "bg-amber-500",
}

const REASON_LABEL: Record<string, string> = {
  OUT_OF_STOCK: "Tükendi",
  QUALITY: "Kalite",
  PREP_TIME: "Hazırlık Süresi",
  OTHER: "Kapalı",
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
                      size="icon-sm"
                      aria-label="Kategoriyi düzenle"
                      onClick={() =>
                        setCategoryDialog({ open: true, category })
                      }
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Kategoriyi sil"
                      onClick={() => {
                        if (window.confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
                          deleteCategory.execute({ id: category.id })
                        }
                      }}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Bu kategoride henüz ürün bulunmuyor.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onEdit={() => setItemDialog({ open: true, item })}
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
      <Toaster />
    </div>
  )
}

function ItemCard({
  item,
  onEdit,
  onDelete,
  on86,
  onReenable,
  onRecipe,
}: {
  item: MenuItemDTO
  onEdit: () => void
  onDelete: () => void
  on86: () => void
  onReenable: () => void
  onRecipe: () => void
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex gap-3">
        {item.images[0] ? (
          <Image
            src={item.images[0].url}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-md">
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
          aria-label="Ürünü düzenle"
          onClick={onEdit}
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Ürünü sil"
          onClick={onDelete}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
