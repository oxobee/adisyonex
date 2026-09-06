"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  BotMessageSquareIcon,
  BoxesIcon,
  CheckCircle2Icon,
  FileTextIcon,
  FileUpIcon,
  GiftIcon,
  ImagePlusIcon,
  InfoIcon,
  Loader2Icon,
  LogInIcon,
  SendIcon,
  SparklesIcon,
  StoreIcon,
  UserCheckIcon,
  WandSparklesIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  getRestaurantModulesAction,
  impersonateRestaurantAction,
  listRestaurantNotificationsAction,
  sendRestaurantNotificationAction,
  toggleRestaurantModuleAction,
} from "@/actions/admin-modules.actions";
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
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RestaurantListItemDTO } from "@/types/admin";
import type {
  RestaurantModuleStatusDTO,
  RestaurantNotificationDTO,
} from "@/services/module.service";

function getModuleIcon(key: string) {
  switch (key) {
    case "qr_ai":
      return BotMessageSquareIcon;
    case "admin_ai":
      return SparklesIcon;
    case "ai_menu_import":
      return FileUpIcon;
    case "ai_image_generation":
      return ImagePlusIcon;
    case "ai_photo_enhance":
      return WandSparklesIcon;
    case "ai_copywriter_nutrition":
      return FileTextIcon;
    case "birthday_automation":
      return GiftIcon;
    case "qr_customer_auth":
      return UserCheckIcon;
    default:
      return SparklesIcon;
  }
}

export function RestaurantDetailDialog({
  restaurant,
  open,
  onOpenChange,
}: {
  readonly restaurant: RestaurantListItemDTO | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "modules" | "notification">("info");

  // Modules state
  const [modules, setModules] = useState<readonly RestaurantModuleStatusDTO[]>([]);
  const [isModulesLoading, setIsModulesLoading] = useState(false);

  // Notification form state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifButtonText, setNotifButtonText] = useState("");
  const [notifButtonUrl, setNotifButtonUrl] = useState("");
  const [notifications, setNotifications] = useState<readonly RestaurantNotificationDTO[]>([]);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Load modules & notifications when dialog opens
  useEffect(() => {
    if (open && restaurant) {
      setTab("info");
      loadModules(restaurant.id);
      loadNotifications(restaurant.id);
    }
  }, [open, restaurant]);

  const loadModules = async (restaurantId: string) => {
    setIsModulesLoading(true);
    try {
      const res = await getRestaurantModulesAction({ restaurantId });
      if (res.success && res.data) {
        setModules(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsModulesLoading(false);
    }
  };

  const loadNotifications = async (restaurantId: string) => {
    setIsNotifLoading(true);
    try {
      const res = await listRestaurantNotificationsAction({ restaurantId });
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsNotifLoading(false);
    }
  };

  const handleToggleModule = (moduleId: string, currentActive: boolean) => {
    if (!restaurant) return;

    startTransition(async () => {
      const res = await toggleRestaurantModuleAction({
        restaurantId: restaurant.id,
        moduleId,
        isActive: !currentActive,
      });

      if (res.success) {
        toast.success(
          `Modül ${!currentActive ? "aktif edildi" : "pasif yapıldı"}`
        );
        // Update local state optimistically
        setModules((prev) =>
          prev.map((m) =>
            m.moduleId === moduleId
              ? {
                  ...m,
                  isAssignedToRestaurant: true,
                  isRestaurantActive: !currentActive,
                }
              : m
          )
        );
        router.refresh();
      } else {
        toast.error(res.error || "İşlem başarısız oldu");
      }
    });
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !notifTitle.trim() || !notifMessage.trim()) return;

    startTransition(async () => {
      const res = await sendRestaurantNotificationAction({
        restaurantId: restaurant.id,
        title: notifTitle,
        message: notifMessage,
        buttonText: notifButtonText.trim() || null,
        buttonUrl: notifButtonUrl.trim() || null,
      });

      if (res.success && res.data) {
        const newNotif = res.data;
        toast.success("Bildirim başarıyla gönderildi!");
        setNotifTitle("");
        setNotifMessage("");
        setNotifButtonText("");
        setNotifButtonUrl("");
        setNotifications((prev) => [newNotif, ...prev]);
      } else {
        toast.error(res.error || "Bildirim gönderilemedi");
      }
    });
  };

  const handleImpersonate = () => {
    if (!restaurant) return;
    startTransition(async () => {
      const res = await impersonateRestaurantAction({
        restaurantId: restaurant.id,
      });
      if (res.success && res.data) {
        toast.success(`"${res.data.restaurantName}" hesabına giriş yapılıyor...`);
        window.location.href = res.data.redirectUrl;
      } else {
        toast.error(res.error || "Giriş başarısız oldu");
      }
    });
  };

  if (!restaurant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <StoreIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                  {restaurant.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Restoran detayları, modül yetkileri ve bildirim yönetimi
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleImpersonate}
              disabled={isPending}
              className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-xs shadow-sm transition-all active:scale-95 cursor-pointer h-8.5 px-3 shrink-0"
              title="Bu restoranın yönetim paneline doğrudan giriş yap"
            >
              <LogInIcon className="size-3.5 mr-1" />
              <span>Hesaba Giriş Yap</span>
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 pt-3 border-t mt-3">
            <button
              type="button"
              onClick={() => setTab("info")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                tab === "info"
                  ? "bg-primary text-primary-foreground font-black shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <InfoIcon className="size-3.5" />
              <span>Genel Bilgiler</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("modules")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                tab === "modules"
                  ? "bg-primary text-primary-foreground font-black shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <BoxesIcon className="size-3.5" />
              <span>Modül Yönetimi</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-primary-foreground/20">
                {isModulesLoading && modules.length === 0
                  ? "…"
                  : modules.filter((m) => m.isRestaurantActive).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("notification")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                tab === "notification"
                  ? "bg-primary text-primary-foreground font-black shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <BellIcon className="size-3.5" />
              <span>Bildirim Gönder</span>
              {notifications.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-primary-foreground/20">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </DialogHeader>

        {/* Tab Contents (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. INFO TAB */}
          {tab === "info" && (
            <div className="flex flex-col gap-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border p-3.5 bg-muted/20">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Kullanıcı Adı / QR Slug
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground mt-0.5 block">
                    {restaurant.username ?? "—"}
                  </span>
                </div>

                <div className="rounded-2xl border p-3.5 bg-muted/20">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    İşletmeci Adı
                  </span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block">
                    {restaurant.ownerName ?? "—"}
                  </span>
                </div>

                <div className="rounded-2xl border p-3.5 bg-muted/20">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    İşletmeci Telefon
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground mt-0.5 block">
                    {restaurant.ownerPhone}
                  </span>
                </div>

                <div className="rounded-2xl border p-3.5 bg-muted/20">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    Şehir / Ülke
                  </span>
                  <span className="text-sm font-bold text-foreground mt-0.5 block">
                    {[restaurant.city, restaurant.country].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border p-3.5 bg-muted/20">
                <span className="text-[11px] font-bold text-muted-foreground block">Adres</span>
                <span className="text-sm font-medium text-foreground mt-0.5 block">
                  {restaurant.addressLine1 || "Adres girilmemiş."}
                </span>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground font-semibold">Kayıt Tarihi:</span>
                <span className="font-bold">{formatDate(restaurant.onboardedAt)}</span>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground font-semibold">Yayın Durumu:</span>
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-black border",
                    restaurant.isActive
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {restaurant.isActive ? "Aktif" : "Pasif"}
                </span>
              </div>

              <div className="mt-2 pt-3 border-t">
                <Button
                  type="button"
                  onClick={handleImpersonate}
                  disabled={isPending}
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm shadow-md shadow-amber-600/20 h-11 transition-all active:scale-98"
                >
                  <LogInIcon className="size-4 mr-2" />
                  Bu Restoranın Hesabına Giriş Yap
                </Button>
              </div>
            </div>
          )}

          {/* 2. MODULES TAB */}
          {tab === "modules" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h4 className="text-sm font-black text-foreground">
                    Restorana Özel Modül Yetkilendirme
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Bu restoranın kullanabileceği özellikleri ve yapay zeka modüllerini açıp kapatın.
                  </p>
                </div>
                {isModulesLoading && (
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {modules.map((m) => {
                  const Icon = getModuleIcon(m.key);
                  const isEnabled = m.isRestaurantActive;

                  return (
                    <div
                      key={m.moduleId}
                      className={cn(
                        "flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all",
                        isEnabled
                          ? "bg-card border-primary/30 shadow-2xs"
                          : "bg-muted/30 border-border/60 opacity-85"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl shrink-0 shadow-2xs",
                            isEnabled
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="font-black text-xs sm:text-sm text-foreground truncate">
                              {m.name}
                            </h5>
                            {!m.isGloballyActive && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                Genel Pasif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {m.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs font-black text-muted-foreground tabular-nums hidden sm:inline-block">
                          {m.price} {m.currency}/ay
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleModule(m.moduleId, isEnabled)}
                          disabled={isPending}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer border shadow-2xs",
                            isEnabled
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                          )}
                        >
                          {isEnabled ? (
                            <>
                              <CheckCircle2Icon className="size-3.5" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="size-3.5" />
                              <span>Pasif</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. NOTIFICATION TAB */}
          {tab === "notification" && (
            <div className="flex flex-col gap-6">
              {/* Send form */}
              <form onSubmit={handleSendNotification} className="flex flex-col gap-3 rounded-2xl border p-4 bg-card shadow-2xs">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <SendIcon className="size-4 text-primary" />
                  <span>Restorana Yeni Bildirim Gönder</span>
                </h4>
                <p className="text-xs text-muted-foreground -mt-1">
                  Gönderdiğiniz bildirim restoran yöneticisinin ana ekranında anında görüntülenecektir.
                </p>

                <Field>
                  <FieldLabel htmlFor="notif-title">Bildirim Başlığı *</FieldLabel>
                  <Input
                    id="notif-title"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Örn: Yeni Özellik Eklendi!"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="notif-msg">Mesaj Metni *</FieldLabel>
                  <textarea
                    id="notif-msg"
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs sm:text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Restorana iletmek istediğiniz detaylı açıklama..."
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="notif-btn-text">Buton Metni (İsteğe Bağlı)</FieldLabel>
                    <Input
                      id="notif-btn-text"
                      value={notifButtonText}
                      onChange={(e) => setNotifButtonText(e.target.value)}
                      placeholder="Örn: Hemen İncele"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="notif-btn-url">Buton Bağlantısı (URL / Rota)</FieldLabel>
                    <Input
                      id="notif-btn-url"
                      value={notifButtonUrl}
                      onChange={(e) => setNotifButtonUrl(e.target.value)}
                      placeholder="/dashboard/menu veya https://..."
                    />
                  </Field>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPending || !notifTitle.trim() || !notifMessage.trim()}
                    className="rounded-xl font-black text-xs"
                  >
                    <SendIcon className="size-3.5 mr-1" />
                    {isPending ? "Gönderiliyor…" : "Bildirimi Gönder"}
                  </Button>
                </div>
              </form>

              {/* Sent notifications history */}
              <div className="flex flex-col gap-2.5">
                <h5 className="text-xs font-black uppercase text-muted-foreground tracking-wider">
                  Daha Önce Gönderilen Bildirimler ({notifications.length})
                </h5>

                {isNotifLoading ? (
                  <div className="flex items-center justify-center p-6 text-muted-foreground text-xs">
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Bildirimler yükleniyor...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Bu restorana henüz bildirim gönderilmemiş.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-2xl border p-3.5 bg-muted/20 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs text-foreground">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {n.message}
                        </p>
                        {n.buttonText && (
                          <div className="pt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                              Buton: {n.buttonText} → {n.buttonUrl || "#"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-card">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
