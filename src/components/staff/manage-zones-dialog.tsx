"use client";

import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Edit2Icon,
  InfoIcon,
  MapPinIcon,
  PlusIcon,
  PrinterIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  createZoneAction,
  updateZoneAction,
  deleteZoneAction,
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
import { cn } from "@/lib/utils";
import type { RestaurantZoneDTO } from "@/types/staff";

const PRESET_COLORS = [
  { name: "Kırmızı", value: "#EF4444" },
  { name: "Turuncu", value: "#F97316" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Yeşil", value: "#10B981" },
  { name: "Mavi", value: "#3B82F6" },
  { name: "Mor", value: "#8B5CF6" },
  { name: "Pembe", value: "#EC4899" },
  { name: "Gri", value: "#6B7280" },
];

interface ManageZonesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: RestaurantZoneDTO[];
  onZonesUpdated: () => void;
  onZoneSelected?: (zoneId: string) => void;
}

export function ManageZonesDialog({
  open,
  onOpenChange,
  zones,
  onZonesUpdated,
  onZoneSelected,
}: ManageZonesDialogProps) {
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [printerIp, setPrinterIp] = useState("");
  const [printerPort, setPrinterPort] = useState<string>("9100");
  const [printerModel, setPrinterModel] = useState("");
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const startEdit = (zone: RestaurantZoneDTO) => {
    setEditingZoneId(zone.id);
    setName(zone.name);
    setCode(zone.code || "");
    setDescription(zone.description || "");
    setColor(zone.color || "#3B82F6");
    setPrinterIp(zone.printerIp || "");
    setPrinterPort(zone.printerPort ? String(zone.printerPort) : "9100");
    setPrinterModel(zone.printerModel || "");
    setShowPrinterSettings(Boolean(zone.printerIp || zone.printerModel));
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingZoneId(null);
    setName("");
    setCode("");
    setDescription("");
    setColor("#3B82F6");
    setPrinterIp("");
    setPrinterPort("9100");
    setPrinterModel("");
    setShowPrinterSettings(false);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Bölge adı boş bırakılamaz.");
      return;
    }

    setLoading(true);
    try {
      const portNum = printerPort.trim() ? parseInt(printerPort.trim(), 10) : undefined;
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        color: color.trim() || undefined,
        printerIp: printerIp.trim() || undefined,
        printerPort: isNaN(portNum as number) ? undefined : portNum,
        printerModel: printerModel.trim() || undefined,
      };

      if (editingZoneId) {
        const res = await updateZoneAction({
          id: editingZoneId,
          ...payload,
        });
        if (res.success) {
          toast.success("Bölge güncellendi.");
          resetForm();
          onZonesUpdated();
        } else {
          toast.error(res.error || "Güncelleme başarısız.");
        }
      } else {
        const res = await createZoneAction(payload);
        if (res.success) {
          toast.success("Yeni bölge oluşturuldu.");
          if (onZoneSelected && res.data) {
            onZoneSelected(res.data.id);
          }
          resetForm();
          onZonesUpdated();
        } else {
          toast.error(res.error || "Bölge eklenemedi.");
        }
      }
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (zone: RestaurantZoneDTO) => {
    if (zone.isDefault || zone.name.toLowerCase() === "genel") {
      toast.error("Varsayılan 'Genel' bölgesi silinemez.");
      return;
    }

    if (
      !confirm(
        `'${zone.name}' bölgesini silmek istediğinize emin misiniz?\n\nBu bölgeye bağlı personeller otomatik olarak 'Genel' bölgesine aktarılacaktır.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await deleteZoneAction({ id: zone.id });
      if (res.success) {
        toast.success(
          `'${zone.name}' bölgesi silindi. Personeller 'Genel' bölgesine aktarıldı.`
        );
        onZonesUpdated();
      } else {
        toast.error(res.error || "Bölge silinemedi.");
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
              <MapPinIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Çalışma Bölgeleri ve İstasyonlar
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Mutfak, Bar, Kasa vb. personelin çalışma alanları ve yazıcı altyapısı.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Bilgilendirme */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-900 dark:text-blue-300">
          <InfoIcon className="size-4 shrink-0 mt-0.5" />
          <span>
            <strong>Bölge & Yazıcı Altyapısı:</strong> Bölgeler personellerinizin görev yerini belirler
            ve ileride bu bölgelere özel termal adisyon yazıcıları (Mutfak, Bar, Kasa) atanması için
            hazırlanmıştır. Bir bölgeyi sildiğinizde personeller otomatik <strong>&quot;Genel&quot;</strong> bölgesine
            aktarılır.
          </span>
        </div>

        {/* Form Alanı */}
        {showAddForm ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">
                {editingZoneId ? "Bölgeyi Düzenle" : "Yeni Bölge Ekle"}
              </span>
              <button
                type="button"
                onClick={resetForm}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field>
                <FieldLabel htmlFor="zone-name">Bölge Adı</FieldLabel>
                <Input
                  id="zone-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Mutfak, Bar, Kasa, Teras"
                  className="rounded-xl font-bold bg-background"
                  required
                  autoFocus
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="zone-code">Bölge Kodu</FieldLabel>
                <Input
                  id="zone-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Örn: KITCHEN, BAR"
                  className="rounded-xl font-mono uppercase bg-background text-xs"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="zone-desc">Açıklama (Opsiyonel)</FieldLabel>
              <Input
                id="zone-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: Sıcak ve soğuk mutfak hazırlık alanı"
                className="rounded-xl bg-background text-xs"
              />
            </Field>

            {/* Renk Seçimi */}
            <div>
              <span className="text-xs font-bold text-foreground block mb-1.5">
                Bölge Rozet Rengi
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={cn(
                      "size-7 rounded-full transition-all cursor-pointer shadow-xs",
                      color === c.value
                        ? "ring-3 ring-foreground/40 scale-110"
                        : "opacity-80 hover:opacity-100"
                    )}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Gelişmiş Yazıcı Altyapısı Accordion */}
            <div className="rounded-xl border border-border/80 bg-background/80 p-3 mt-1">
              <button
                type="button"
                onClick={() => setShowPrinterSettings((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-bold text-foreground cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-primary">
                  <PrinterIcon className="size-4" />
                  <span>Yazıcı Altyapısı (Opsiyonel / İleriye Hazır)</span>
                </div>
                {showPrinterSettings ? (
                  <ChevronUpIcon className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                )}
              </button>

              {showPrinterSettings && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 mt-2 border-t border-border/60">
                  <Field className="col-span-2 sm:col-span-1">
                    <FieldLabel htmlFor="p-ip">Yazıcı IP Adresi</FieldLabel>
                    <Input
                      id="p-ip"
                      value={printerIp}
                      onChange={(e) => setPrinterIp(e.target.value)}
                      placeholder="192.168.1.200"
                      className="rounded-xl font-mono text-xs"
                    />
                  </Field>

                  <Field className="col-span-2 sm:col-span-1">
                    <FieldLabel htmlFor="p-port">Port</FieldLabel>
                    <Input
                      id="p-port"
                      value={printerPort}
                      onChange={(e) => setPrinterPort(e.target.value)}
                      placeholder="9100"
                      className="rounded-xl font-mono text-xs"
                    />
                  </Field>

                  <Field className="col-span-2">
                    <FieldLabel htmlFor="p-model">Yazıcı Modeli / Türü</FieldLabel>
                    <Input
                      id="p-model"
                      value={printerModel}
                      onChange={(e) => setPrinterModel(e.target.value)}
                      placeholder="Örn: Epson TM-T20III / 80mm ESC/POS"
                      className="rounded-xl text-xs"
                    />
                  </Field>
                </div>
              )}
            </div>

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
                {editingZoneId ? "Güncelle" : "Bölgeyi Kaydet"}
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
            <span>Yeni Bölge Ekle</span>
          </Button>
        )}

        {/* Bölge Listesi */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-muted-foreground">
            Tanımlı Bölgeler ({zones.length})
          </span>
          <div className="flex flex-col divide-y rounded-2xl border border-border/80 bg-muted/20 overflow-hidden">
            {zones.map((z) => (
              <div
                key={z.id}
                className="flex items-center justify-between p-3 gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="size-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: z.color || "#3B82F6" }}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">
                        {z.name}
                      </span>
                      {z.code && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {z.code}
                        </span>
                      )}
                      {z.isDefault && (
                        <Badge variant="outline" className="text-[10px] bg-muted font-normal">
                          Varsayılan
                        </Badge>
                      )}
                      {z.printerIp && (
                        <Badge variant="secondary" className="text-[10px] gap-1 font-mono">
                          <PrinterIcon className="size-2.5" />
                          {z.printerIp}
                        </Badge>
                      )}
                    </div>
                    {z.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {z.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => startEdit(z)}
                    title="Düzenle"
                  >
                    <Edit2Icon className="size-3.5" />
                  </Button>

                  {!z.isDefault && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                      onClick={() => handleDelete(z)}
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
