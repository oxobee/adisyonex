"use client";

import { useState } from "react";
import {
  PhoneCallIcon,
  MapPinIcon,
  UserIcon,
  XIcon,
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
  StickyNoteIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface CustomerAddressItem {
  id: string;
  title: string;
  address: string;
  isDefault?: boolean;
  isLastUsed?: boolean;
}

interface PosCustomerBannerProps {
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly customerAddress?: string;
  readonly customerNotes?: string | null;
  readonly addresses?: CustomerAddressItem[];
  readonly onSelectAddress: (address: string) => void;
  readonly onClearCustomer: () => void;
  readonly onAddAddress?: (newAddr: { title: string; address: string }) => void;
}

export function PosCustomerBanner({
  customerName,
  customerPhone,
  customerAddress,
  customerNotes,
  addresses = [],
  onSelectAddress,
  onClearCustomer,
  onAddAddress,
}: PosCustomerBannerProps) {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("Ev");
  const [newAddressText, setNewAddressText] = useState("");

  if (!customerPhone && !customerName) {
    return null;
  }

  const handleSaveNewAddress = () => {
    if (!newAddressText.trim()) return;
    if (onAddAddress) {
      onAddAddress({
        title: newTitle,
        address: newAddressText.trim(),
      });
    }
    onSelectAddress(newAddressText.trim());
    setNewAddressText("");
    setShowAddForm(false);
    setIsAddressModalOpen(false);
  };

  return (
    <>
      <div className="mx-2.5 sm:mx-3 mt-2 mb-1 p-2.5 rounded-2xl bg-gradient-to-r from-rose-50/90 via-amber-50/70 to-rose-50/80 border border-rose-200/90 shadow-2xs text-left animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center justify-center size-5 rounded-full bg-rose-600 text-white shrink-0">
              <PhoneCallIcon className="size-3" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
              Telefon Siparişi
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-white/90 border-rose-300 text-rose-700 font-bold"
            >
              Kurye / Paket
            </Badge>
          </div>

          <button
            type="button"
            onClick={onClearCustomer}
            title="Müşteri ve Telefon Bağlantısını Kaldır"
            className="size-5 rounded-md hover:bg-rose-200/60 text-rose-400 hover:text-rose-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <XIcon className="size-3" />
          </button>
        </div>

        {/* Customer Details Row */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <UserIcon className="size-3.5 text-slate-500 shrink-0" />
            <span className="font-extrabold text-slate-900 truncate">
              {customerName || "İsimsiz Müşteri"}
            </span>
            {customerPhone && (
              <span className="font-mono text-[11px] text-slate-500 font-semibold shrink-0">
                • {customerPhone}
              </span>
            )}
          </div>

          {/* Address Action Button */}
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(true)}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
          >
            <span>{customerAddress ? "Adresi Değiştir" : "+ Adres Seç"}</span>
            <ChevronDownIcon className="size-3" />
          </button>
        </div>

        {/* Selected Address Display */}
        {customerAddress && (
          <div className="mt-1.5 pt-1.5 border-t border-rose-200/60 flex items-start gap-1.5 text-[11px] text-slate-700 leading-snug">
            <MapPinIcon className="size-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2 select-text font-medium">
              {customerAddress}
            </span>
          </div>
        )}

        {/* Customer Notes (if any) */}
        {customerNotes && (
          <div className="mt-1 pt-1 border-t border-amber-200/50 flex items-center gap-1 text-[10px] text-amber-800 font-medium italic">
            <StickyNoteIcon className="size-3 text-amber-600 shrink-0" />
            <span className="truncate">Not: {customerNotes}</span>
          </div>
        )}
      </div>

      {/* Adres Seçim & Ekleme Modalı */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <MapPinIcon className="size-4 text-rose-600" />
              <span>Teslimat Adresi Seçimi</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {addresses.length === 0 && !showAddForm ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Kayıtlı teslimat adresi bulunamadı.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {addresses.map((addr) => {
                  const isSelected = customerAddress === addr.address;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        onSelectAddress(addr.address);
                        setIsAddressModalOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/70 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {addr.title}
                        </span>
                        {isSelected && <CheckIcon className="size-4 text-rose-600" />}
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">
                        {addr.address}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Yeni Adres Ekle Formu */}
            {showAddForm ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Yeni Adres Tanımla
                  </span>
                  <div className="flex gap-1">
                    {["Ev", "İş", "Diğer"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewTitle(t)}
                        className={`text-[10px] px-2 py-0.5 rounded border ${
                          newTitle === t
                            ? "bg-rose-600 text-white border-rose-600 font-bold"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={newAddressText}
                  onChange={(e) => setNewAddressText(e.target.value)}
                  placeholder="Mahalle, Sokak, Bina No, Daire, İlçe..."
                  rows={2}
                  className="text-xs resize-none bg-white"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={() => setShowAddForm(false)}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    onClick={handleSaveNewAddress}
                    disabled={!newAddressText.trim()}
                  >
                    Adresi Kaydet & Seç
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full text-xs font-semibold gap-1.5 border-dashed"
                onClick={() => setShowAddForm(true)}
              >
                <PlusIcon className="size-3.5" />
                <span>+ Yeni Adres Ekle</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
