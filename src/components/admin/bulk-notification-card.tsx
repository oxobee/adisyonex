"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BellRingIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2Icon,
  MegaphoneIcon,
  SearchIcon,
  SendIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";

import { sendBulkRestaurantNotificationAction } from "@/actions/admin-modules.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface RestaurantMinimalOption {
  readonly id: string;
  readonly name: string;
  readonly username?: string | null;
  readonly slug?: string;
}

export function BulkNotificationCard({
  restaurants = [],
}: {
  readonly restaurants: readonly RestaurantMinimalOption[];
}) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [targetType, setTargetType] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");

  const [isPending, startTransition] = useTransition();

  // Filter restaurants by search term
  const filteredRestaurants = useMemo(() => {
    if (!searchTerm.trim()) return restaurants;
    const q = searchTerm.toLowerCase();
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.username && r.username.toLowerCase().includes(q)) ||
        (r.slug && r.slug.toLowerCase().includes(q))
    );
  }, [restaurants, searchTerm]);

  const toggleSelectRestaurant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(restaurants.map((r) => r.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Lütfen bildirim başlığı ve mesajını doldurunuz.");
      return;
    }

    if (targetType === "SELECTED" && selectedIds.length === 0) {
      toast.error("Lütfen bildirim gönderilecek en az bir restoran seçiniz.");
      return;
    }

    const recipientCount =
      targetType === "ALL" ? restaurants.length : selectedIds.length;

    startTransition(async () => {
      const res = await sendBulkRestaurantNotificationAction({
        target: targetType,
        restaurantIds: targetType === "SELECTED" ? selectedIds : undefined,
        title: title.trim(),
        message: message.trim(),
        buttonText: buttonText.trim() || null,
        buttonUrl: buttonUrl.trim() || null,
      });

      if (res.success) {
        toast.success(
          `${res.data?.count ?? recipientCount} restorana bildirim başarıyla iletildi! 📢`
        );
        setTitle("");
        setMessage("");
        setButtonText("");
        setButtonUrl("");
        setSelectedIds([]);
        setIsExpanded(false);
        router.refresh();
      } else {
        toast.error(res.error || "Bildirim gönderilirken bir hata oluştu.");
      }
    });
  };

  const targetCount =
    targetType === "ALL" ? restaurants.length : selectedIds.length;

  return (
    <div className="rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-5 sm:p-6 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
            <MegaphoneIcon className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Restoranlara Bildirim Gönder
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
                Toplu / Çoklu
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Tüm restoranların dashboard bildirim merkezine anında sistem duyurusu veya bilgilendirme mesajı iletin.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={isExpanded ? "outline" : "default"}
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn(
            "rounded-xl font-bold cursor-pointer transition-all",
            !isExpanded && "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          )}
        >
          {isExpanded ? (
            <>
              <span>Formu Gizle</span>
              <ChevronUpIcon className="size-4 ml-1.5" />
            </>
          ) : (
            <>
              <BellRingIcon className="size-4 mr-1.5" />
              <span>Yeni Bildirim Oluştur</span>
              <ChevronDownIcon className="size-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>

      {/* Collapsible Form */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-6 pt-5 border-t border-indigo-100/80 flex flex-col gap-5">
          {/* Target Type Selector */}
          <div>
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider block mb-2">
              Gönderim Hedefi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetType("ALL")}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer",
                  targetType === "ALL"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      targetType === "ALL" ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                    )}
                  >
                    {targetType === "ALL" && <div className="size-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 block">
                      Tüm Restoranlar (Toplu)
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Kayıtlı toplam {restaurants.length} aktif işletmeye aynı anda iletilir.
                    </span>
                  </div>
                </div>
                <UsersIcon className="size-5 text-indigo-500 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setTargetType("SELECTED")}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer",
                  targetType === "SELECTED"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center shrink-0",
                      targetType === "SELECTED" ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300"
                    )}
                  >
                    {targetType === "SELECTED" && <div className="size-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 block">
                      Seçili Restoranlar (Çoklu Seçim)
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      Yalnızca aşağıda işaretlediğiniz işletmelere iletilir ({selectedIds.length} seçili).
                    </span>
                  </div>
                </div>
                <StoreIcon className="size-5 text-indigo-500 shrink-0" />
              </button>
            </div>
          </div>

          {/* Restaurant Multi-Select Box (If SELECTED) */}
          {targetType === "SELECTED" && (
            <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-800">
                    Restoran Listesi
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {selectedIds.length} / {restaurants.length} Seçildi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Restoran adı veya kullanıcı adına göre filtrele..."
                  className="pl-8 text-xs h-8 bg-gray-50/70"
                />
              </div>

              {/* Checkbox grid */}
              <div className="max-h-48 overflow-y-auto pr-1 space-y-1 divide-y divide-gray-100">
                {filteredRestaurants.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Restoran bulunamadı.</p>
                ) : (
                  filteredRestaurants.map((res) => {
                    const isChecked = selectedIds.includes(res.id);
                    return (
                      <label
                        key={res.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors",
                          isChecked ? "bg-indigo-50/80 font-bold text-indigo-900" : "hover:bg-gray-50 text-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRestaurant(res.id)}
                            className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="truncate">{res.name}</span>
                          {res.username && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              @{res.username}
                            </span>
                          )}
                        </div>
                        {isChecked && (
                          <CheckCircle2Icon className="size-4 text-indigo-600 shrink-0 ml-2" />
                        )}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Title & Message Fields */}
          <div className="grid grid-cols-1 gap-4">
            <Field>
              <FieldLabel htmlFor="notif-title" className="text-xs font-black text-gray-800">
                Bildirim Başlığı <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="notif-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Yeni Sürüm Yayında! v2.4 Yenilikleri"
                required
                className="bg-white"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notif-message" className="text-xs font-black text-gray-800">
                Bildirim Metni <span className="text-red-500">*</span>
              </FieldLabel>
              <textarea
                id="notif-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                placeholder="Restoranların göreceği ayrıntılı sistem mesajını buraya yazın..."
                className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>

            {/* Optional Button details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="notif-btn-text" className="text-xs font-bold text-gray-700">
                  Buton Metni (İsteğe Bağlı)
                </FieldLabel>
                <Input
                  id="notif-btn-text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Örn: Hemen İncele"
                  className="bg-white"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="notif-btn-url" className="text-xs font-bold text-gray-700">
                  Buton Bağlantısı (URL / Rota)
                </FieldLabel>
                <Input
                  id="notif-btn-url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="Örn: /dashboard/settings veya https://..."
                  className="bg-white"
                />
              </Field>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100">
            <div className="text-xs text-gray-500">
              Gönderilecek Alıcı: <strong className="text-indigo-700">{targetCount} Restoran</strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(false)}
                className="cursor-pointer"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isPending || targetCount === 0 || !title.trim() || !message.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Gönderiliyor…
                  </>
                ) : (
                  <>
                    <SendIcon className="size-4 mr-2" />
                    Bildirimi Gönder ({targetCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
