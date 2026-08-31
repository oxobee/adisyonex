"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"

import { toast } from "sonner"

import { updateTaxProfileAction } from "@/actions/settings.actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Toaster } from "@/components/ui/sonner"
import { useServerAction } from "@/hooks/use-server-action"
import type { GstRegistrationType, TaxProfileDTO } from "@/types/settings"

const TYPES: { value: GstRegistrationType; label: string }[] = [
  { value: "UNREGISTERED", label: "KDV Muaf / Mükellef Değil" },
  { value: "REGULAR", label: "Normal KDV Mükellefi" },
  { value: "COMPOSITION", label: "Basit Usul / Özel Matrah" },
]

export function TaxSettingsForm({ profile }: { profile: TaxProfileDTO }) {
  const router = useRouter()
  const [type, setType] = useState<GstRegistrationType>(
    profile.gstRegistrationType,
  )
  const [rate, setRate] = useState(
    profile.serviceGstRate != null ? String(profile.serviceGstRate) : "",
  )
  const [gstin, setGstin] = useState(profile.gstin ?? "")
  const [sacCode, setSac] = useState(profile.sacCode ?? "")
  const [inclusive, setInclusive] = useState(profile.pricesTaxInclusive)

  const save = useServerAction(updateTaxProfileAction, {
    onSuccess: () => {
      toast.success("Vergi ayarları kaydedildi")
      router.refresh()
    },
    onError: (message) => toast.error(message),
  })

  const registered = type !== "UNREGISTERED"

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    save.execute({
      gstRegistrationType: type,
      serviceGstRate: registered && rate ? Number(rate) : undefined,
      pricesTaxInclusive: inclusive,
      gstin: registered && gstin ? gstin : undefined,
      sacCode: registered && sacCode ? sacCode : undefined,
    })
  }

  return (
    <>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>KDV &amp; Vergi Ayarları</CardTitle>
          <CardDescription>
            Menü ürünleri ve hesap fişlerindeki KDV / vergi oranlarını yapılandırın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="reg-type">Vergi Mükellefiyeti</FieldLabel>
              <Select
                value={type}
                onValueChange={(v) =>
                  v && setType(v as GstRegistrationType)
                }
              >
                <SelectTrigger id="reg-type">
                  <span>{TYPES.find((t) => t.value === type)?.label}</span>
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {registered ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="rate">KDV Oranı (%)</FieldLabel>
                    <Input
                      id="rate"
                      inputMode="decimal"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="10"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sac">Vergi / Hizmet Kodu</FieldLabel>
                    <Input
                      id="sac"
                      value={sacCode}
                      onChange={(e) => setSac(e.target.value)}
                      placeholder="996331"
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="gstin">Vergi Numarası (VKN / TCKN)</FieldLabel>
                  <Input
                    id="gstin"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="VKN veya TC Kimlik No"
                  />
                </Field>
                <div className="flex items-center gap-2">
                  <Switch
                    id="incl"
                    checked={inclusive}
                    onCheckedChange={setInclusive}
                  />
                  <label htmlFor="incl" className="text-sm">
                    Menü fiyatlarına KDV dahildir
                  </label>
                </div>
                {type === "COMPOSITION" ? (
                  <p className="text-muted-foreground text-xs">
                    Basit Usul: Fiş üzerinde KDV ayrı gösterilmez — fiyatlar KDV dahil kabul edilir.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                KDV uygulanmayacak. Ürünlerde ve fişlerde KDV muaf olarak işlem görür.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </>
  )
}
