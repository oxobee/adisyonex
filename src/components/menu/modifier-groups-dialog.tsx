"use client"

import { useState } from "react"

import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  createGroupAction,
  deleteGroupAction,
  updateGroupAction,
} from "@/actions/menu.actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useServerAction } from "@/hooks/use-server-action"
import type { MenuModifierGroupDTO } from "@/types/menu"

type ModRow = { name: string; priceDelta: string }

export function ModifierGroupsDialog({
  open,
  groups,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  groups: readonly MenuModifierGroupDTO[]
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [editing, setEditing] = useState<MenuModifierGroupDTO | null | "new">(
    null,
  )

  const del = useServerAction(deleteGroupAction, {
    onSuccess: () => {
      toast.success("Seçenek grubu silindi")
      onSaved()
    },
    onError: (message) => toast.error(message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? editing === "new"
                ? "Yeni Seçenek Grubu"
                : "Seçenek Grubunu Düzenle"
              : "Ekstra / Seçenek Grupları"}
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <GroupForm
            group={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              onSaved()
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {groups.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Henüz ekstra grubu yok. Bir grup oluşturun (Örn: &quot;Soslar&quot;,
                &quot;İçecek Seçimi&quot;).
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {groups.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{g.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {g.modifiers.length} seçenek ·{" "}
                        {g.isRequired ? "zorunlu" : "isteğe bağlı"} ·{" "}
                        {g.minSelect}–{g.maxSelect} adet seçilebilir
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(g)}
                        aria-label="Grubu düzenle"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          if (confirm(`"${g.name}" grubunu silmek istediğinize emin misiniz?`)) {
                            del.execute({ id: g.id })
                          }
                        }}
                        aria-label="Grubu sil"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              className="self-start"
              onClick={() => setEditing("new")}
            >
              <PlusIcon className="size-4" /> Yeni Grup Ekle
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function GroupForm({
  group,
  onCancel,
  onSaved,
}: {
  group: MenuModifierGroupDTO | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(group?.name ?? "")
  const [minSelect, setMin] = useState(String(group?.minSelect ?? 0))
  const [maxSelect, setMax] = useState(String(group?.maxSelect ?? 1))
  const [isRequired, setRequired] = useState(group?.isRequired ?? false)
  const [mods, setMods] = useState<ModRow[]>(
    group
      ? group.modifiers.map((m) => ({
          name: m.name,
          priceDelta: String(m.priceDelta),
        }))
      : [{ name: "", priceDelta: "" }],
  )

  const save = useServerAction(group ? updateGroupAction : createGroupAction, {
    onSuccess: () => {
      toast.success(group ? "Grup güncellendi" : "Grup oluşturuldu")
      onSaved()
    },
    onError: (message) => toast.error(message),
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const modifiers = mods
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name, priceDelta: Number(m.priceDelta || 0) }))
    const payload = {
      name,
      minSelect: Number(minSelect || 0),
      maxSelect: Number(maxSelect || 1),
      isRequired,
      modifiers,
    }
    save.execute(group ? { ...payload, id: group.id } : payload)
  }

  const setMod = (index: number, key: keyof ModRow, value: string) =>
    setMods((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    )

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="grp-name">Grup Adı</FieldLabel>
        <Input
          id="grp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: Sos Seçimi, Pişme Derecesi"
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field>
          <FieldLabel htmlFor="grp-min">Min Seçim Sayısı</FieldLabel>
          <Input
            id="grp-min"
            inputMode="numeric"
            value={minSelect}
            onChange={(e) => setMin(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="grp-max">Maks Seçim Sayısı</FieldLabel>
          <Input
            id="grp-max"
            inputMode="numeric"
            value={maxSelect}
            onChange={(e) => setMax(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="grp-req"
          checked={isRequired}
          onCheckedChange={setRequired}
        />
        <label htmlFor="grp-req" className="text-sm">
          Zorunlu Seçim
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Seçenekler</span>
        {mods.map((m, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Örn: Ketçap, Acı Sos"
              value={m.name}
              onChange={(e) => setMod(i, "name", e.target.value)}
            />
            <Input
              placeholder="+₺ Fiyat Farkı"
              inputMode="decimal"
              value={m.priceDelta}
              onChange={(e) => setMod(i, "priceDelta", e.target.value)}
              className="w-28"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMods((prev) => prev.filter((_, j) => j !== i))}
              aria-label="Seçeneği kaldır"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            setMods((prev) => [...prev, { name: "", priceDelta: "" }])
          }
        >
          <PlusIcon className="size-4" /> + Seçenek Ekle
        </Button>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={save.isPending || !name.trim()}>
          {save.isPending ? "Kaydediliyor…" : "Grubu Kaydet"}
        </Button>
      </div>
    </form>
  )
}
