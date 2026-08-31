"use client";

import { useState } from "react";

import { onboardRestaurantAction } from "@/actions/restaurant.actions";
import { PhoneInput } from "@/components/phone-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";

export function OnboardRestaurantForm() {
  const [name, setName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { execute, isPending } = useServerAction(onboardRestaurantAction, {
    redirectTo: "/admin/restaurants",
    refresh: true,
    onError: (message) => setError(message),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    execute({
      name,
      ownerPhone,
      ownerName: ownerName || undefined,
      city: city || undefined,
      country: "IN",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="name">Restoran Adı</FieldLabel>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Örn: Lezzet Durağı"
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="ownerPhone">İşletmeci Telefonu</FieldLabel>
        <PhoneInput
          id="ownerPhone"
          onChange={setOwnerPhone}
          invalid={Boolean(error)}
        />
        <FieldDescription>
          Yönetici paneline giriş yapmak için kullanılır.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="ownerName">İşletmeci Adı (isteğe bağlı)</FieldLabel>
        <Input
          id="ownerName"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          placeholder="Ad Soyad"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="city">Şehir (isteğe bağlı)</FieldLabel>
        <Input
          id="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="İstanbul"
        />
      </Field>
      {error ? (
        <FieldDescription className="text-destructive">{error}</FieldDescription>
      ) : null}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Kaydediliyor…" : "Restoranı Kaydet"}
        </Button>
      </div>
    </form>
  );
}
