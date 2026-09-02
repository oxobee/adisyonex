"use client";

import { useMemo, useState, useCallback } from "react";
import {
  CakeIcon,
  CalendarIcon,
  ChevronRightIcon,
  CreditCardIcon,
  EyeIcon,
  GiftIcon,
  HeartIcon,
  PhoneIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Trash2Icon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteCustomerAction,
  getAdminCustomerDetailAction,
} from "@/actions/customer.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServerAction } from "@/hooks/use-server-action";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CustomerDTO, CustomerProfileDTO } from "@/services/customer.service";

const MONTHS = [
  { value: "ALL", label: "Tüm Aylar" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
];

export function CustomersTable({
  initialCustomers,
}: {
  initialCustomers: readonly CustomerDTO[];
}) {
  const [customers, setCustomers] = useState<CustomerDTO[]>([...initialCustomers]);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState<CustomerDTO | null>(null);

  // Customer Detail Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailProfile, setDetailProfile] = useState<CustomerProfileDTO | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const currentMonth = new Date().getMonth() + 1;

  const removeCustomer = useServerAction(deleteCustomerAction, {
    onSuccess: () => {
      if (deleteTarget) {
        setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      }
      toast.success("Müşteri kaydı silindi");
      setDeleteTarget(null);
    },
    onError: (m) => toast.error(m || "Silme işlemi başarısız oldu"),
  });

  const handleOpenDetail = useCallback(async (customer: CustomerDTO) => {
    setSelectedCustomerId(customer.id);
    setLoadingDetail(true);
    try {
      const res = await getAdminCustomerDetailAction({ customerId: customer.id });
      if (res.success && res.data) {
        setDetailProfile(res.data);
      } else {
        toast.error("Müşteri detayları alınamadı");
      }
    } catch {
      toast.error("Müşteri detayları yüklenirken bir hata oluştu");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);

      const matchMonth =
        selectedMonth === "ALL" ||
        (c.birthMonth != null && String(c.birthMonth) === selectedMonth);

      return matchSearch && matchMonth;
    });
  }, [customers, search, selectedMonth]);

  const thisMonthCount = useMemo(() => {
    return customers.filter((c) => c.birthMonth === currentMonth).length;
  }, [customers, currentMonth]);

  return (
    <div className="flex flex-col gap-6">
      {/* STATS CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UsersIcon className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Kayıtlı Müşteri</p>
            <h3 className="text-2xl font-black tracking-tight text-foreground">
              {customers.length}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CakeIcon className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Bu Ay Doğanlar</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight text-foreground">
                {thisMonthCount}
              </h3>
              {thisMonthCount > 0 ? (
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                  Kutlama Fırsatı 🎁
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <GiftIcon className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Sadakat & Kampanyalar</p>
            <p className="text-xs font-bold text-foreground">Otomatik İndirim Aktif</p>
          </div>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya telefon ile ara…"
            className="h-10 pl-10 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={(v) => v && setSelectedMonth(v)}>
            <SelectTrigger className="h-10 w-44 rounded-xl">
              <span>{MONTHS.find((m) => m.value === selectedMonth)?.label}</span>
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="font-bold">Müşteri</TableHead>
              <TableHead className="font-bold">Telefon</TableHead>
              <TableHead className="font-bold">Doğum Tarihi</TableHead>
              <TableHead className="font-bold">Sipariş Sayısı</TableHead>
              <TableHead className="font-bold">Toplam Harcama</TableHead>
              <TableHead className="font-bold">Kayıt Tarihi</TableHead>
              <TableHead className="text-right font-bold">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Kayıtlı müşteri bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => {
                const isCurrentMonthBirthday = c.birthMonth === currentMonth;
                return (
                  <TableRow
                    key={c.id}
                    onClick={() => handleOpenDetail(c)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground text-sm hover:underline">
                          {c.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">
                        {c.phone}
                      </span>
                    </TableCell>
                    <TableCell>
                      {c.birthDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {formatDate(c.birthDate)}
                          </span>
                          {isCurrentMonthBirthday ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                              🎂 Bu Ay!
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Belirtilmemiş
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-foreground tabular-nums">
                        {c.orderCount || 0} sipariş
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-primary tabular-nums">
                        {formatCurrency(c.totalSpent || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Detaylı Müşteri Kartını Aç"
                          onClick={() => handleOpenDetail(c)}
                        >
                          <EyeIcon className="size-4" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ============================================================ */}
      {/* DETAILED FULLSCREEN CUSTOMER CARD MODAL (MÜŞTERİ KARTI)      */}
      {/* ============================================================ */}
      <Dialog
        open={Boolean(selectedCustomerId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomerId(null);
            setDetailProfile(null);
          }
        }}
      >
        <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[94vh] rounded-3xl p-0 overflow-hidden flex flex-col gap-0 bg-card border shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                  {detailProfile?.customer.name.charAt(0).toUpperCase() || "M"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-black text-foreground truncate">
                      {detailProfile?.customer.name || "Müşteri Kartı"}
                    </DialogTitle>
                    {detailProfile?.customer.birthMonth === currentMonth && (
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold shrink-0">
                        🎂 Bu Ay Doğum Günü!
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 font-mono font-bold text-foreground">
                      <PhoneIcon className="size-3.5 text-primary" />
                      {detailProfile?.customer.phone}
                    </span>
                    {detailProfile?.customer.birthDate && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3.5 text-muted-foreground" />
                        {formatDate(detailProfile.customer.birthDate)}
                      </span>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      Kaynak: {detailProfile?.customer.source || "QR Menü"}
                    </Badge>
                  </div>
                </div>
              </div>

              {detailProfile?.customer.kvkkConsent && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
                  <ShieldCheckIcon className="size-4" />
                  <span>KVKK Onaylı</span>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loadingDetail ? (
              <div className="py-20 text-center space-y-2">
                <div className="size-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground font-bold">Müşteri siparişleri ve istatistikleri yükleniyor…</p>
              </div>
            ) : detailProfile ? (
              <>
                {/* METRICS SUMMARY */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">Toplam Sipariş</span>
                    <span className="text-xl font-black text-primary tabular-nums block mt-0.5">
                      {detailProfile.stats.orderCount} kez
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">Toplam Harcama</span>
                    <span className="text-xl font-black text-foreground tabular-nums block mt-0.5">
                      {formatCurrency(detailProfile.stats.totalSpent)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">Ort. Sepet Tutarı</span>
                    <span className="text-xl font-black text-foreground tabular-nums block mt-0.5">
                      {formatCurrency(detailProfile.stats.averageOrderValue)}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-muted-foreground block">Kayıt Tarihi</span>
                    <span className="text-xs font-black text-foreground block mt-1">
                      {formatDate(detailProfile.customer.createdAt)}
                    </span>
                  </div>
                </div>

                {/* EN ÇOK SEVDİĞİ LEZZETLER (FAVORİLER) */}
                {detailProfile.favoriteItems.length > 0 && (
                  <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <HeartIcon className="size-4 text-red-500 fill-red-500" />
                        <span>En Çok Tercih Ettiği Lezzetler</span>
                      </h4>
                      <span className="text-xs text-muted-foreground font-bold">
                        Top {detailProfile.favoriteItems.length} Ürün
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {detailProfile.favoriteItems.map((fav, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-muted/40 border border-border/80 text-xs font-bold"
                        >
                          <span className="text-amber-500">⭐</span>
                          <span className="text-foreground">{fav.name}</span>
                          <Badge variant="secondary" className="text-[10px] font-black h-5 px-1.5">
                            {fav.count} kez
                          </Badge>
                          <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
                            ({formatCurrency(fav.totalSpent)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GEÇMİŞ SİPARİŞLER (TARİHSEL VE KATEGORİZE) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ReceiptIcon className="size-4 text-primary" />
                      <span>Sipariş Geçmişi ({detailProfile.orders.length})</span>
                    </h4>
                    <span className="text-xs text-muted-foreground">Tarihsel Sıralı</span>
                  </div>

                  {detailProfile.orders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center text-muted-foreground text-xs space-y-1">
                      <ShoppingBagIcon className="size-8 mx-auto opacity-40 mb-2" />
                      <p className="font-bold">Henüz Sipariş Bulunmuyor</p>
                      <p className="text-[11px]">Müşteri QR menüden sipariş verdiğinde tüm detaylar burada listelenecektir.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {detailProfile.orders.map((ord) => (
                        <div
                          key={ord.id}
                          className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-black text-xs text-foreground">
                                Sipariş #{ord.orderNumber || ord.id.slice(-6)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                • {formatDate(ord.createdAt)}
                              </span>
                              {ord.tableLabel && (
                                <Badge variant="outline" className="text-[10px] font-bold">
                                  Masa: {ord.tableLabel}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  "text-[10px] font-black",
                                  ord.status === "COMPLETED" || ord.status === "SETTLED"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
                                )}
                              >
                                {ord.status === "OPEN"
                                  ? "Açık / Hazırlanıyor"
                                  : ord.status === "COMPLETED"
                                    ? "Tamamlandı"
                                    : ord.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Sipariş Satır Kalemleri */}
                          <div className="divide-y divide-border/40 text-xs">
                            {ord.lines.map((line) => (
                              <div
                                key={line.id}
                                className="py-1.5 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-foreground tabular-nums">
                                    {line.quantity}×
                                  </span>
                                  <span className="text-foreground font-medium">
                                    {line.name}
                                  </span>
                                  {line.variantName && (
                                    <span className="text-muted-foreground text-[11px]">
                                      ({line.variantName})
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono font-bold tabular-nums text-foreground">
                                  {formatCurrency(line.unitPrice * line.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-border/60 pt-2 flex items-center justify-between font-black text-sm">
                            <span className="text-muted-foreground text-xs font-medium">Toplam Sipariş Tutarı</span>
                            <span className="text-primary tabular-nums">
                              {formatCurrency(ord.grandTotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/10">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCustomerId(null);
                setDetailProfile(null);
              }}
              className="rounded-xl font-bold"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle>Müşteri Kaydını Sil</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.name}</strong> isimli müşterinin kaydı silinecektir. Bu işlemi onaylıyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              disabled={removeCustomer.isPending}
              onClick={() => deleteTarget && removeCustomer.execute({ id: deleteTarget.id })}
            >
              {removeCustomer.isPending ? "Siliniyor…" : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
