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
  RefreshCwIcon,
  Trash2Icon,
  WifiIcon,
  MonitorIcon,
  PlayIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PrinterClient } from "@/lib/printer/printer-client";
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

  // Printer configuration state
  const [printerEnabled, setPrinterEnabled] = useState(false);
  const [printerConnectionType, setPrinterConnectionType] = useState<"LOCAL_OS" | "NETWORK">("LOCAL_OS");
  const [printerSystemName, setPrinterSystemName] = useState("");
  const [printerIp, setPrinterIp] = useState("");
  const [printerPort, setPrinterPort] = useState<string>("9100");
  const [printerModel, setPrinterModel] = useState("");
  const [printerPaperWidth, setPrinterPaperWidth] = useState<number>(80);
  const [printerAutoPrint, setPrinterAutoPrint] = useState(false);

  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Hardware client scanning & testing state
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isScanningPrinters, setIsScanningPrinters] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "connected" | "disconnected">("idle");
  const [isTestingPrint, setIsTestingPrint] = useState(false);

  const scanPrinters = async () => {
    setIsScanningPrinters(true);
    try {
      const res = await PrinterClient.detectPrinters();
      if (res.available && res.printers.length > 0) {
        setAvailablePrinters(res.printers);
        setScanStatus("connected");
        if (!printerSystemName) {
          setPrinterSystemName(res.printers[0]);
        }
        toast.success(`QZ Tray bağlandı: ${res.printers.length} yazıcı bulundu.`);
      } else {
        setScanStatus("disconnected");
        toast.warning(
          res.error || "QZ Tray aktif değil. Yerel OS yazıcılarını otomatik taramak için QZ Tray uygulamasını çalıştırın."
        );
      }
    } catch {
      setScanStatus("disconnected");
      toast.error("Yazıcı servisine erişilemedi.");
    } finally {
      setIsScanningPrinters(false);
    }
  };

  const startEdit = (zone: RestaurantZoneDTO) => {
    setEditingZoneId(zone.id);
    setName(zone.name);
    setCode(zone.code || "");
    setDescription(zone.description || "");
    setColor(zone.color || "#3B82F6");

    const isEnabled = Boolean(
      zone.printerEnabled ||
      zone.printerIp ||
      zone.printerSystemName ||
      zone.printerModel
    );
    setPrinterEnabled(isEnabled);

    const connType = (zone.printerConnectionType as "LOCAL_OS" | "NETWORK") ||
      (zone.printerIp ? "NETWORK" : "LOCAL_OS");
    setPrinterConnectionType(connType);

    setPrinterSystemName(zone.printerSystemName || zone.printerModel || "");
    setPrinterIp(zone.printerIp || "");
    setPrinterPort(zone.printerPort ? String(zone.printerPort) : "9100");
    setPrinterModel(zone.printerModel || "");
    setPrinterPaperWidth(zone.printerPaperWidth ?? 80);
    setPrinterAutoPrint(zone.printerAutoPrint ?? false);

    setShowPrinterSettings(isEnabled);
    setShowAddForm(true);

    if (connType === "LOCAL_OS" && availablePrinters.length === 0) {
      void scanPrinters();
    }
  };

  const resetForm = () => {
    setEditingZoneId(null);
    setName("");
    setCode("");
    setDescription("");
    setColor("#3B82F6");

    setPrinterEnabled(false);
    setPrinterConnectionType("LOCAL_OS");
    setPrinterSystemName("");
    setPrinterIp("");
    setPrinterPort("9100");
    setPrinterModel("");
    setPrinterPaperWidth(80);
    setPrinterAutoPrint(false);

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
        printerEnabled,
        printerConnectionType: printerEnabled ? printerConnectionType : undefined,
        printerSystemName: printerEnabled && printerConnectionType === "LOCAL_OS" ? (printerSystemName.trim() || undefined) : undefined,
        printerIp: printerEnabled && printerConnectionType === "NETWORK" ? (printerIp.trim() || undefined) : undefined,
        printerPort: printerEnabled && printerConnectionType === "NETWORK" && !isNaN(portNum as number) ? portNum : undefined,
        printerModel: printerModel.trim() || (printerConnectionType === "LOCAL_OS" ? printerSystemName.trim() : undefined) || undefined,
        printerPaperWidth: printerEnabled ? printerPaperWidth : 80,
        printerAutoPrint: printerEnabled ? printerAutoPrint : false,
      };

      if (editingZoneId) {
        const res = await updateZoneAction({
          id: editingZoneId,
          ...payload,
        });
        if (res.success) {
          toast.success("Bölge ve yazıcı ayarları güncellendi.");
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

  const handleTestPrint = async (targetZone?: RestaurantZoneDTO) => {
    const zoneToTest: RestaurantZoneDTO = targetZone || {
      id: editingZoneId || "temp",
      restaurantId: "current",
      name: name.trim() || "Mutfak",
      code: code.trim() || null,
      description: description.trim() || null,
      color,
      printerIp: printerIp.trim() || null,
      printerPort: printerPort.trim() ? parseInt(printerPort.trim(), 10) : 9100,
      printerModel: printerModel.trim() || null,
      printerEnabled: true,
      printerConnectionType,
      printerSystemName: printerSystemName.trim() || printerModel.trim() || null,
      printerPaperWidth,
      printerAutoPrint,
      isDefault: false,
      sortOrder: 0,
    };

    setIsTestingPrint(true);
    try {
      const res = await PrinterClient.printTestReceipt(zoneToTest);
      if (res.success) {
        toast.success(res.message || `'${zoneToTest.name}' test fişi başarıyla yazdırıldı.`);
      } else {
        toast.error(res.error || "Test fişi yazdırılamadı.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test fişi gönderilirken hata oluştu.");
    } finally {
      setIsTestingPrint(false);
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl rounded-3xl p-6">
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
                Mutfak, Bar, Kasa vb. personelin çalışma alanları ve termal yazıcı istasyonları.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Bilgilendirme */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-900 dark:text-blue-300">
          <InfoIcon className="size-4 shrink-0 mt-0.5" />
          <span>
            <strong>Bölge & Yazıcı Altyapısı:</strong> Bölgeler hem personellerin görev yerlerini
            belirler hem de ilgili menü kategorilerinden gelen siparişleri otomatik termal yazıcılara
            (Mutfak KOT, Bar KOT, Kasa Fişi) yönlendirir.
          </span>
        </div>

        {/* Form Alanı */}
        {showAddForm ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3.5 p-4 rounded-2xl border border-primary/20 bg-primary/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">
                {editingZoneId ? "Bölgeyi & Yazıcıyı Düzenle" : "Yeni Bölge & İstasyon Ekle"}
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
                  className="rounded-xl font-bold bg-background text-xs"
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
                  placeholder="Örn: KITCHEN, BAR, CASHIER"
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

            {/* Gelişmiş Yazıcı Altyapısı */}
            <div className="rounded-2xl border border-border/80 bg-background/90 p-3.5 mt-1 shadow-xs">
              <button
                type="button"
                onClick={() => setShowPrinterSettings((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs font-bold text-foreground cursor-pointer"
              >
                <div className="flex items-center gap-2 text-primary">
                  <PrinterIcon className="size-4" />
                  <span>Yazıcı Altyapısı & İstasyon Entegrasyonu</span>
                  {printerEnabled && (
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold">
                      Aktif ({printerPaperWidth}mm)
                    </Badge>
                  )}
                </div>
                {showPrinterSettings ? (
                  <ChevronUpIcon className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                )}
              </button>

              {showPrinterSettings && (
                <div className="flex flex-col gap-3.5 pt-3.5 mt-2.5 border-t border-border/60">
                  {/* [ ] Bu bölgede yazıcı kullan toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">
                        Bu bölgede yazıcı kullan
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Siparişler onaylandığında bu bölgenin yazıcısına KOT fişi gönderilir.
                      </span>
                    </div>
                    <Switch
                      checked={printerEnabled}
                      onCheckedChange={(checked) => setPrinterEnabled(checked)}
                    />
                  </div>

                  {printerEnabled && (
                    <>
                      {/* Bağlantı Türü: LOCAL_OS vs NETWORK */}
                      <div>
                        <span className="text-xs font-bold text-foreground block mb-1.5">
                          Bağlantı Türü
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPrinterConnectionType("LOCAL_OS");
                              if (availablePrinters.length === 0) {
                                void scanPrinters();
                              }
                            }}
                            className={cn(
                              "flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                              printerConnectionType === "LOCAL_OS"
                                ? "border-primary bg-primary/10 text-primary shadow-xs"
                                : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                            )}
                          >
                            <MonitorIcon className="size-4" />
                            <span>Bilgisayara Bağlı (OS)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPrinterConnectionType("NETWORK")}
                            className={cn(
                              "flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                              printerConnectionType === "NETWORK"
                                ? "border-primary bg-primary/10 text-primary shadow-xs"
                                : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                            )}
                          >
                            <WifiIcon className="size-4" />
                            <span>Ağ / IP Yazıcı (Network)</span>
                          </button>
                        </div>
                      </div>

                      {/* LOCAL_OS Fields */}
                      {printerConnectionType === "LOCAL_OS" && (
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/20 border border-border/60">
                          <div className="flex items-center justify-between">
                            <FieldLabel htmlFor="p-sysname">Sistem Yazıcısı</FieldLabel>
                            <div className="flex items-center gap-2">
                              {scanStatus === "connected" && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  <CheckCircle2Icon className="size-3" />
                                  QZ Tray Bağlı ({availablePrinters.length})
                                </span>
                              )}
                              {scanStatus === "disconnected" && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                  <AlertCircleIcon className="size-3" />
                                  QZ Tray Çevrimdışı
                                </span>
                              )}
                              {isScanningPrinters && (
                                <span className="flex items-center gap-1 text-[10px] text-primary font-bold">
                                  <RefreshCwIcon className="size-3 animate-spin" />
                                  Taranıyor...
                                </span>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={scanPrinters}
                                disabled={isScanningPrinters}
                                className="h-6 px-2 text-[10px] gap-1 rounded-lg cursor-pointer"
                              >
                                <RefreshCwIcon className={cn("size-2.5", isScanningPrinters && "animate-spin")} />
                                <span>Yazıcıları Tara</span>
                              </Button>
                            </div>
                          </div>

                          {availablePrinters.length > 0 ? (
                            <div className="flex gap-2">
                              <select
                                id="p-sysname"
                                value={printerSystemName}
                                onChange={(e) => setPrinterSystemName(e.target.value)}
                                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="">-- Yazıcı Seçin --</option>
                                {availablePrinters.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <Input
                              id="p-sysname"
                              value={printerSystemName}
                              onChange={(e) => setPrinterSystemName(e.target.value)}
                              placeholder="Örn: XP-80C veya EPSON TM-T20III"
                              className="rounded-xl font-medium text-xs bg-background"
                            />
                          )}

                          {scanStatus === "disconnected" && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300 flex flex-col gap-1">
                              <span>
                                QZ Tray servisine bağlanılamadı. QZ Tray masaüstü uygulamasının açık olduğundan ve izin penceresinde <strong>&quot;Allow / İzin Ver&quot;</strong> dediğinizden emin olun.
                              </span>
                              {typeof window !== "undefined" && window.location.protocol === "https:" && (
                                <span>
                                  💡 <strong>HTTPS İpucu:</strong> Tarayıcınızda bir defaya mahsus{" "}
                                  <a
                                    href="https://localhost:8181"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline font-bold text-amber-900 dark:text-amber-200"
                                  >
                                    https://localhost:8181
                                  </a>{" "}
                                  adresine gidip <em>&quot;Gelişmiş &rarr; localhost sitesine ilerle (güvenli değil)&quot;</em> izni vermeniz gerekebilir.
                                </span>
                              )}
                            </div>
                          )}

                          <span className="text-[10px] text-muted-foreground">
                            İşletim sisteminde kurulu termal yazıcının adı (USB / Seri / Bluetooth / Paylaşılan). Manuel olarak da yazabilirsiniz.
                          </span>
                        </div>
                      )}

                      {/* NETWORK Fields */}
                      {printerConnectionType === "NETWORK" && (
                        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                          <Field className="col-span-2">
                            <FieldLabel htmlFor="p-ip">Yazıcı IP Adresi</FieldLabel>
                            <Input
                              id="p-ip"
                              value={printerIp}
                              onChange={(e) => setPrinterIp(e.target.value)}
                              placeholder="192.168.1.200"
                              className="rounded-xl font-mono text-xs bg-background"
                            />
                          </Field>

                          <Field className="col-span-1">
                            <FieldLabel htmlFor="p-port">Port</FieldLabel>
                            <Input
                              id="p-port"
                              value={printerPort}
                              onChange={(e) => setPrinterPort(e.target.value)}
                              placeholder="9100"
                              className="rounded-xl font-mono text-xs bg-background"
                            />
                          </Field>
                        </div>
                      )}

                      {/* Kağıt Genişliği ve Otomatik Yazdır */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs font-bold text-foreground block mb-1.5">
                            Kağıt Genişliği
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPrinterPaperWidth(80)}
                              className={cn(
                                "py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                                printerPaperWidth === 80
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                              )}
                            >
                              80 mm
                            </button>
                            <button
                              type="button"
                              onClick={() => setPrinterPaperWidth(58)}
                              className={cn(
                                "py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                                printerPaperWidth === 58
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/70 hover:bg-muted/40 text-muted-foreground"
                              )}
                            >
                              58 mm
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col justify-end">
                          <div className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/20 h-[38px]">
                            <span className="text-xs font-bold text-foreground">Otomatik Yazdır</span>
                            <Switch
                              checked={printerAutoPrint}
                              onCheckedChange={(checked) => setPrinterAutoPrint(checked)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Test Yazdır Butonu */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          <span>Doğrudan termal ESC/POS çıktısı</span>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTestPrint()}
                          disabled={isTestingPrint || (!printerSystemName && !printerIp)}
                          className="gap-1.5 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          <PlayIcon className={cn("size-3.5 fill-current", isTestingPrint && "animate-spin")} />
                          <span>{isTestingPrint ? "Yazdırılıyor..." : "Test Yazdır"}</span>
                        </Button>
                      </div>
                    </>
                  )}
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
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-dashed border-2 py-5 font-bold hover:bg-muted/50 cursor-pointer"
          >
            <PlusIcon className="size-4 text-primary" />
            <span>Yeni Bölge & İstasyon Ekle</span>
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {(z.printerEnabled || z.printerIp || z.printerSystemName) && (
                        <Badge variant="secondary" className="text-[10px] gap-1 font-mono">
                          <PrinterIcon className="size-2.5 text-primary" />
                          {z.printerConnectionType === "NETWORK" || z.printerIp
                            ? `${z.printerIp || "Ağ"}:${z.printerPort || 9100}`
                            : (z.printerSystemName || z.printerModel || "OS Yazıcı")}
                          <span className="text-[9px] opacity-70">({z.printerPaperWidth || 80}mm)</span>
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
                  {(z.printerEnabled || z.printerIp || z.printerSystemName) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={() => handleTestPrint(z)}
                      title="Hızlı Test Yazdır"
                      disabled={isTestingPrint}
                    >
                      <PlayIcon className="size-3.5" />
                    </Button>
                  )}

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
