"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircleIcon,
  CameraIcon,
  CheckCircle2Icon,
  FileImageIcon,
  HelpCircleIcon,
  ImageIcon,
  InfoIcon,
  LightbulbIcon,
  Loader2Icon,
  PaperclipIcon,
  PlusIcon,
  RocketIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitFeedbackAction } from "@/actions/feedback.actions";

export type FeedbackCategoryType = "SUGGESTION" | "REQUEST" | "COMPLAINT" | "BUG";

interface FeedbackModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialCategory?: FeedbackCategoryType;
  readonly initialScreenshot?: string | null;
  readonly initialAttachments?: readonly string[];
  readonly onRequestScreenCapture?: () => void;
}

const CATEGORY_PLACEHOLDERS: Record<
  FeedbackCategoryType,
  { title: string; message: string }
> = {
  SUGGESTION: {
    title: "Örn: Masa sipariş ekranında hızlı indirim ve ödeme butonu eklenebilir",
    message:
      "Örn: Adisyon kapatılırken tek dokunuşla nakit veya POS seçimi yapılırsa garsonların hızlanacağını düşünüyorum. Ayrıca...",
  },
  REQUEST: {
    title: "Örn: Gün sonu raporlarının Excel (XLSX) formatında otomatik indirilmesi",
    message:
      "Örn: Muhasebe departmanımıza iletmek üzere her akşam gün sonu Z raporu ve ürün bazlı satışların XLSX çıktısını almak istiyoruz...",
  },
  COMPLAINT: {
    title: "Örn: Yoğun saatlerde mutfak ekranı senkronizasyon gecikmesi",
    message:
      "Örn: Akşam 19:00 - 21:00 arasında masadan verilen siparişler mutfak ekranına bazen 1-2 dakika geç düşüyor, lütfen kontrol edilsin...",
  },
  BUG: {
    title: "Örn: İndirim uygulandığında dip toplam yanlış hesaplanıyor",
    message:
      "Örn: Adisyona %10 indirim uyguladığımda genel toplam değişmiyor ancak KDV satırında değişiklik oluyor. Ekran görüntüsü ektedir...",
  },
};

const CATEGORIES = [
  {
    id: "SUGGESTION" as const,
    title: "Öneri",
    description: "Yeni bir fikir & tavsiye",
    icon: LightbulbIcon,
    color: "text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-400",
    activeColor: "bg-blue-600 text-white border-blue-600 shadow-md",
    badge: "💡 Öneri",
  },
  {
    id: "REQUEST" as const,
    title: "İstek",
    description: "Yeni özellik talebi",
    icon: RocketIcon,
    color: "text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-400",
    activeColor: "bg-amber-600 text-white border-amber-600 shadow-md",
    badge: "🚀 İstek",
  },
  {
    id: "COMPLAINT" as const,
    title: "Şikayet",
    description: "Memnuniyetsizlik",
    icon: AlertCircleIcon,
    color: "text-rose-600 bg-rose-50 border-rose-200 hover:border-rose-400",
    activeColor: "bg-rose-600 text-white border-rose-600 shadow-md",
    badge: "⚠️ Şikayet",
  },
  {
    id: "BUG" as const,
    title: "Hata Bildirimi",
    description: "Sistemde aksaklık / hata",
    icon: HelpCircleIcon,
    color: "text-red-600 bg-red-50 border-red-200 hover:border-red-400",
    activeColor: "bg-red-600 text-white border-red-600 shadow-md",
    badge: "🐞 Hata",
  },
];

export function FeedbackModal({
  isOpen,
  onClose,
  initialCategory = "SUGGESTION",
  initialScreenshot = null,
  initialAttachments = [],
  onRequestScreenCapture,
}: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategoryType>(initialCategory);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial props
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialScreenshot) {
      setAttachments((prev) => {
        if (!prev.includes(initialScreenshot)) {
          return [initialScreenshot, ...prev];
        }
        return prev;
      });
    }
  }, [initialScreenshot]);

  useEffect(() => {
    if (initialAttachments && initialAttachments.length > 0) {
      setAttachments((prev) => {
        const set = new Set([...prev, ...initialAttachments]);
        return Array.from(set);
      });
    }
  }, [initialAttachments]);

  // Handle device image selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error("Lütfen sadece resim veya PDF dosyası seçin");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} boyutu 8MB'dan büyük olamaz`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAttachments((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Lütfen başlık ve açıklama alanlarını doldurunuz");
      return;
    }

    setIsSubmitting(true);
    try {
      const deviceInfo = {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
        os: typeof navigator !== "undefined" ? navigator.platform : "",
        screenResolution:
          typeof window !== "undefined"
            ? `${window.screen.width}x${window.screen.height}`
            : "",
        path: typeof window !== "undefined" ? window.location.pathname : "",
        timestamp: new Date().toISOString(),
      };

      const res = await submitFeedbackAction({
        category,
        title: title.trim(),
        message: message.trim(),
        attachments,
        deviceInfo,
      });

      if (res.success) {
        toast.success("Geri bildiriminiz başarıyla iletildi! 🎉", {
          description: "Görüş ve bildiriminiz için teşekkür ederiz. İlgili ekip inceleyecektir.",
        });
        // Reset form
        setTitle("");
        setMessage("");
        setAttachments([]);
        onClose();
      } else {
        toast.error(res.error || "Geri bildirim gönderilemedi");
      }
    } catch {
      toast.error("Gönderim sırasında bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="feedback-dialog-content max-w-xl max-h-[92vh] flex flex-col p-0 rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        {/* MODAL HEADER */}
        <DialogHeader className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 flex flex-row items-center justify-between space-y-0 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <SparklesIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Geri Bildirim & İstek Bildir
              </DialogTitle>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Öneri, geliştirme isteği, şikayet veya karşılaştığınız hataları bildirin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <XIcon className="size-4.5" />
          </button>
        </DialogHeader>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. KATEGORİ SEÇİMİ */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
              1. Bildirim Türü Seçiniz *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all cursor-pointer select-none",
                      isSelected
                        ? cat.activeColor
                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    <Icon className="size-5 mb-1.5" />
                    <span className="text-xs font-black">{cat.title}</span>
                    <span
                      className={cn(
                        "text-[10px] line-clamp-1 mt-0.5",
                        isSelected ? "text-white/90" : "text-gray-400",
                      )}
                    >
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. BAŞLIK */}
          <div className="space-y-1.5">
            <label htmlFor="fb-title" className="text-xs font-black uppercase tracking-wider text-gray-700 block">
              2. Konu / Başlık *
            </label>
            <Input
              id="fb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={CATEGORY_PLACEHOLDERS[category].title}
              className="h-11 rounded-xl text-sm font-medium border-gray-300 focus-visible:ring-indigo-500"
              maxLength={120}
              required
            />
          </div>

          {/* 3. AÇIKLAMA */}
          <div className="space-y-1.5">
            <label htmlFor="fb-msg" className="text-xs font-black uppercase tracking-wider text-gray-700 block">
              3. Açıklama & Detaylar *
            </label>
            <Textarea
              id="fb-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={CATEGORY_PLACEHOLDERS[category].message}
              rows={4}
              className="rounded-xl text-sm font-normal border-gray-300 focus-visible:ring-indigo-500 resize-none"
              maxLength={3000}
              required
            />
          </div>

          {/* 4. GÖRSEL VE EKRAN GÖRÜNTÜSÜ EKLEME ALANI */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                4. Ekran Görüntüsü veya Dosya Ekle ({attachments.length})
              </label>
              <span className="text-[11px] text-gray-400">İsteğe bağlı</span>
            </div>

            {/* Aksiyon Butonları: Cihazdan Yükle & Ekran Görüntüsü Çek */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 h-11 px-3 rounded-2xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-bold text-gray-700 transition-all cursor-pointer active:scale-98"
              >
                <PaperclipIcon className="size-4 text-indigo-600" />
                <span>Cihazdan Görsel Seç</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onRequestScreenCapture) {
                    onRequestScreenCapture();
                  }
                }}
                className="flex items-center justify-center gap-2 h-11 px-3 rounded-2xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100/80 text-xs font-bold text-indigo-800 transition-all cursor-pointer active:scale-98"
              >
                <CameraIcon className="size-4 text-indigo-600" />
                <span>Ekran Görüntüsü Çek</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Ekli Görseller / Ekran Görüntüleri Önizlemesi */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200">
                {attachments.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group size-16 sm:size-20 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-2xs shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Ek ${idx + 1}`}
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="absolute top-1 right-1 size-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                      title="Kaldır"
                    >
                      <XIcon className="size-3" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-bold py-0.5">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Otomatik Cihaz Bilgisi Bilgilendirme Notu */}
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
            <InfoIcon className="size-4 shrink-0 text-slate-400" />
            <span className="text-[11px] leading-relaxed">
              Hatanın hızla çözülmesi için cihaz, ekran çözünürlüğü ve bulunduğunuz sayfa adresi geri bildiriminize otomatik olarak eklenecektir.
            </span>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl font-bold text-xs cursor-pointer h-10 px-4"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !message.trim()}
              className="rounded-xl font-black text-xs cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-98 transition-all h-10 px-6 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  <span>Gönderiliyor…</span>
                </>
              ) : (
                <>
                  <SendIcon className="size-4" />
                  <span>Geri Bildirimi Gönder</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
