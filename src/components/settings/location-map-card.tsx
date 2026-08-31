"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  clearGeolocationAction,
  updateGeolocationAction,
} from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";
import { cn } from "@/lib/utils";

interface Coords {
  readonly lat: number;
  readonly lng: number;
}

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

const inRange = (value: number, limit: number) =>
  Number.isFinite(value) && value >= -limit && value <= limit;

export function LocationMapCard({
  latitude,
  longitude,
  address,
}: {
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly address?: string | null;
}) {
  const router = useRouter();
  const initial: Coords | null =
    latitude != null && longitude != null
      ? { lat: latitude, lng: longitude }
      : null;

  const [savedPin, setSavedPin] = useState<Coords | null>(initial);
  const [latInput, setLatInput] = useState(
    latitude != null ? String(latitude) : "",
  );
  const [lngInput, setLngInput] = useState(
    longitude != null ? String(longitude) : "",
  );
  const [locating, setLocating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [step, setStep] = useState(5);
  const submittedRef = useRef<Coords | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const watchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bestRef = useRef<(Coords & { accuracy: number }) | null>(null);

  const save = useServerAction(updateGeolocationAction, {
    refresh: true,
    onSuccess: () => {
      if (submittedRef.current) {
        setSavedPin(submittedRef.current);
      }
      toast.success("Konum kaydedildi");
    },
    onError: (message) => toast.error(message),
  });

  const latNum = Number(latInput.trim());
  const lngNum = Number(lngInput.trim());
  const inputsFilled = latInput.trim() !== "" && lngInput.trim() !== "";
  const inputsValid =
    inputsFilled && inRange(latNum, 90) && inRange(lngNum, 180);
  // The pin currently shown/edited — may differ from the saved one until saved.
  const pin: Coords | null = inputsValid
    ? { lat: round6(latNum), lng: round6(lngNum) }
    : null;
  const dirty =
    !!pin &&
    (!savedPin || pin.lat !== savedPin.lat || pin.lng !== savedPin.lng);

  const setPin = (lat: number, lng: number) => {
    setLatInput(String(round6(lat)));
    setLngInput(String(round6(lng)));
  };

  const stopWatch = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (watchTimerRef.current != null) {
      clearTimeout(watchTimerRef.current);
      watchTimerRef.current = null;
    }
  };

  const finishWatch = () => {
    if (watchIdRef.current == null && watchTimerRef.current == null) {
      return;
    }
    stopWatch();
    setLocating(false);
    const best = bestRef.current;
    if (best) {
      setAccuracy(Math.round(best.accuracy));
      setPin(best.lat, best.lng);
      toast.success(
        `Konum tespit edildi (±${Math.round(best.accuracy)} m) — gerekirse ayarlayın ve Kaydedin.`,
      );
    } else {
      toast.error(
        "Doğru konum alınamadı. Tekrar deneyin veya elle girin.",
      );
    }
  };

  // Clean up any in-flight geolocation watch on unmount.
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (watchTimerRef.current != null) {
        clearTimeout(watchTimerRef.current);
      }
    };
  }, []);

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Bu cihazda konum servisi desteklenmiyor.");
      return;
    }
    stopWatch();
    bestRef.current = null;
    setAccuracy(null);
    setLocating(true);
    watchTimerRef.current = setTimeout(finishWatch, 8000);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy: acc } =
          position.coords;
        const prev = bestRef.current;
        if (!prev || acc < prev.accuracy) {
          bestRef.current = { lat, lng, accuracy: acc };
          setAccuracy(Math.round(acc));
        }
        if (acc <= 12) {
          finishWatch();
        }
      },
      (error) => {
        stopWatch();
        setLocating(false);
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? "Konum izni reddedildi — tarayıcıdan izin verin veya koordinatları elle girin."
            : "Konumunuz alınamadı. Tekrar deneyin veya elle girin.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  // Move the pin by whole metres (north / east positive) for fine correction.
  const nudge = (northM: number, eastM: number) => {
    if (!pin) {
      return;
    }
    const dLat = northM / 111320;
    const dLng = eastM / (111320 * Math.cos((pin.lat * Math.PI) / 180));
    setPin(pin.lat + dLat, pin.lng + dLng);
  };

  const persist = (lat: number, lng: number) => {
    const next = { lat: round6(lat), lng: round6(lng) };
    submittedRef.current = next;
    save.execute({ latitude: next.lat, longitude: next.lng });
  };

  const saveManual = () => {
    if (!pin) {
      toast.error("Geçerli bir enlem (-90…90) ve boylam (-180…180) girin.");
      return;
    }
    persist(pin.lat, pin.lng);
  };

  const removePin = async () => {
    setClearing(true);
    const result = await clearGeolocationAction();
    setClearing(false);
    if (result.success) {
      setSavedPin(null);
      setLatInput("");
      setLngInput("");
      setAccuracy(null);
      submittedRef.current = null;
      toast.success("Harita konumu kaldırıldı");
      router.refresh();
    } else {
      toast.error(result.error ?? "İşlem başarısız oldu");
    }
  };

  const embedUrl = pin
    ? `https://maps.google.com/maps?q=${pin.lat},${pin.lng}&z=17&output=embed`
    : null;
  const mapsUrl = pin
    ? `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konum &amp; Harita İğnesi</CardTitle>
        <CardDescription>
          Müşterilerin, kuryelerin ve haritaların sizi tam bulabilmesi için konumunuzu işaretleyin.
          Tek dokunuşla mevcut konumunuzu alın veya koordinatları elle girin.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {address ? (
          <p className="text-muted-foreground text-sm">
            Adres: <span className="text-foreground">{address}</span>{" "}
            <span className="text-xs">(metin adresini İşletme Profili sekmesinden düzenleyin)</span>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={useMyLocation}
            disabled={locating || save.isPending}
          >
            {locating
              ? accuracy != null
                ? `Hassaslaştırılıyor… ±${accuracy} m`
                : "Konum alınıyor…"
              : "Mevcut Konumumu Kullan"}
          </Button>
          {mapsUrl ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" />
              }
            >
              Google Haritalar&apos;da Aç
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="geo-lat">Enlem (Latitude)</FieldLabel>
            <Input
              id="geo-lat"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              inputMode="decimal"
              placeholder="41.0082"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="geo-lng">Boylam (Longitude)</FieldLabel>
            <Input
              id="geo-lng"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              inputMode="decimal"
              placeholder="28.9784"
            />
          </Field>
        </div>
        <FieldDescription>
          Tarayıcı konumu masaüstü veya Wi-Fi ağlarında sapma gösterebilir.
          Otomatik aldıktan sonra ok butonlarıyla tam kapı girişine hizalayıp kaydedin.
        </FieldDescription>

        {pin ? (
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-lg border">
              <iframe
                title="Google Haritalar Restoran Konumu"
                src={embedUrl ?? undefined}
                className="h-64 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Hassas Kaydır</span>
              <div className="flex overflow-hidden rounded-md border">
                {[1, 5, 10].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className={cn(
                      "px-2.5 py-1 text-xs transition-colors",
                      step === s
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s} m
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`İğneyi ${step} m kuzeye taşı`}
                  onClick={() => nudge(step, 0)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`İğneyi ${step} m güneye taşı`}
                  onClick={() => nudge(-step, 0)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`İğneyi ${step} m batıya taşı`}
                  onClick={() => nudge(0, -step)}
                >
                  <ArrowLeftIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`İğneyi ${step} m doğuya taşı`}
                  onClick={() => nudge(0, step)}
                >
                  <ArrowRightIcon />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-muted-foreground text-xs">
                {pin.lat}, {pin.lng}
                {accuracy != null ? ` · sapma ±${accuracy} m` : ""}
                {dirty ? " · kaydedilmemiş" : savedPin ? " · kaydedildi" : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removePin}
                  disabled={clearing}
                >
                  {clearing ? "Kaldırılıyor…" : "İğneyi Kaldır"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={saveManual}
                  disabled={save.isPending || !dirty}
                >
                  {save.isPending ? "Kaydediliyor…" : "İğneyi Kaydet"}
                </Button>
              </div>
            </div>

            {accuracy != null && accuracy > 40 ? (
              <p className="text-xs text-amber-700">
                Yaklaşık tespit (±{accuracy} m). Tam konumu ayarlamak için ok butonlarıyla kaydırın veya telefon üzerinden deneyin.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
            Henüz harita konumu işaretlenmemiş. Konumunuzu tespit edin veya koordinatları girin.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
