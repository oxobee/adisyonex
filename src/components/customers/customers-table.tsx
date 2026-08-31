"use client";

import { useMemo, useState } from "react";
import {
  CakeIcon,
  CalendarIcon,
  GiftIcon,
  PhoneIcon,
  SearchIcon,
  Trash2Icon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { deleteCustomerAction } from "@/actions/customer.actions";
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
import { formatDate } from "@/lib/format";
import type { CustomerDTO } from "@/services/customer.service";

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
            <span className="text-xs font-semibold text-muted-foreground">
              Toplam Kayıtlı Müşteri
            </span>
            <p className="text-2xl font-black text-foreground tabular-nums">
              {customers.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CakeIcon className="size-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">
              Bu Ay Doğum Günü Olanlar
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {thisMonthCount} Kişi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <GiftIcon className="size-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">
              Kayıt Kaynağı
            </span>
            <p className="text-lg font-black text-foreground">
              QR Menü Kampanyaları
            </p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim veya telefon ile ara..."
            className="pl-9 h-10 rounded-xl"
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
              <TableHead className="font-bold">Kayıt Tarihi</TableHead>
              <TableHead className="text-right font-bold">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Kayıtlı müşteri bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((c) => {
                const isCurrentMonthBirthday = c.birthMonth === currentMonth;
                return (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground text-sm">
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
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(c)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
