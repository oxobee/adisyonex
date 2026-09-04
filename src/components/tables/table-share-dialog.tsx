"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PrinterIcon,
  QrCodeIcon,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TableDTO } from "@/types/table";

const fileSlug = (label: string): string =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "table";

export function TableShareDialog({
  table,
  username,
  selfOrderEnabled,
  onOpenChange,
}: {
  readonly table: TableDTO;
  readonly username: string;
  readonly selfOrderEnabled: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : "",
  );
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const link = origin
    ? `${origin}/order/${username}?table=${table.id}`
    : "";

  useEffect(() => {
    if (!link) {
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(link, { width: 1024, margin: 2 })
      .then((url) => {
        if (!cancelled) {
          setQr(url);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [link]);

  const copy = async () => {
    if (!link) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Masa QR bağlantısı panoya kopyalandı ✓");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Bağlantı kopyalanamadı");
    }
  };

  const handlePrint = () => {
    if (!qr) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Yazdırma penceresi açılamadı. Lütfen popup engelleyicinizi kontrol edin.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${table.label} QR Kod</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #fff;
            }
            .card {
              border: 2px solid #000;
              border-radius: 24px;
              padding: 32px;
              text-align: center;
              width: 280px;
            }
            .title {
              font-size: 28px;
              font-weight: 900;
              margin: 0 0 8px 0;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin: 0 0 16px 0;
            }
            img {
              width: 220px;
              height: 220px;
              border-radius: 12px;
            }
            .footer {
              font-size: 13px;
              font-weight: 700;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="title">${table.label}</h1>
            <p class="subtitle">${table.section || "Salon"}</p>
            <img src="${qr}" alt="QR Kod" />
            <p class="footer">📱 Menüyü Görün & Sipariş Verin</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <QrCodeIcon className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-gray-900">
                {table.label} QR Kodu
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {table.section || "Salon"} · Masaya özel temassız menü ve sipariş bağlantısı
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!selfOrderEnabled ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-medium">
            ⚠️ <strong>Müşteri QR siparişi şu anda kapalı.</strong> Bu bağlantı sadece menüyü
            görüntüler. Müşterilerin masadan doğrudan sipariş vermesi için{" "}
            <span className="font-bold underline">Ayarlar → Firma Ayarları</span> alanından QR
            siparişi açabilirsiniz.
          </div>
        ) : null}

        {/* QR Kod Görsel Kutusu */}
        <div className="flex flex-col items-center justify-center p-5 bg-gray-50 rounded-2xl border border-gray-200/80 gap-3">
          {qr ? (
            <div className="p-3 bg-white rounded-2xl shadow-xs border border-gray-100">
              <Image
                src={qr}
                alt={`${table.label} için QR kod`}
                width={200}
                height={200}
                unoptimized
                className="rounded-xl"
              />
            </div>
          ) : (
            <div className="size-[200px] bg-gray-200 animate-pulse rounded-2xl" />
          )}

          <span className="text-xs font-bold text-gray-600 text-center">
            Müşteriler kamerayla okutarak doğrudan {table.label} adisyonuna bağlanır.
          </span>
        </div>

        {/* Bağlantı Kopyalama */}
        <div className="flex items-center gap-2">
          <Input readOnly value={link} className="text-xs rounded-xl bg-gray-50 font-mono" />
          <Button
            size="icon"
            variant="outline"
            className="rounded-xl shrink-0"
            onClick={copy}
            aria-label="Bağlantıyı kopyala"
            title="Bağlantıyı Kopyala"
          >
            {copied ? (
              <CheckIcon className="size-4 text-emerald-600" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>
        </div>

        {/* Eylem Butonları */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button
            onClick={handlePrint}
            disabled={!qr}
            variant="outline"
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <PrinterIcon className="size-3.5" />
            <span>Yazdır</span>
          </Button>

          <Button
            disabled={!qr}
            className="rounded-xl text-xs font-bold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            render={
              <a href={qr ?? undefined} download={`qr-${fileSlug(table.label)}.png`} />
            }
          >
            <DownloadIcon className="size-3.5" />
            <span>İndir (PNG)</span>
          </Button>

          <Button
            variant="outline"
            disabled={!link}
            className="rounded-xl text-xs font-bold gap-1.5"
            render={
              <a href={link || undefined} target="_blank" rel="noopener noreferrer" />
            }
            aria-label="Sipariş sayfasını önizle"
          >
            <ExternalLinkIcon className="size-3.5" />
            <span>Önizle</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
