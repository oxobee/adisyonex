"use client"

import { useState } from "react"

import { UtensilsCrossedIcon } from "lucide-react"

import { requestOtpAction, verifyOtpAction } from "@/actions/auth.actions"
import { startLoginAction, verifyPinAction } from "@/actions/pin.actions"
import { PhoneInput } from "@/components/phone-input"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useServerAction } from "@/hooks/use-server-action"
import { cn } from "@/lib/utils"
import { phoneSchema } from "@/lib/validators/shared"

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OTP_USER_NOT_FOUND:
    "Bu telefon numarası kayıtlı değil. Lütfen yöneticinizle iletişime geçin.",
  PIN_INVALID: "Hatalı PIN kodu.",
  PIN_LOCKED: "Çok fazla başarısız deneme. Giriş yapmak için tek kullanımlık kod kullanın.",
}

const toAuthMessage = (raw: string) => AUTH_ERROR_MESSAGES[raw] ?? raw

import Image from "next/image"

type Step = "phone" | "pin" | "code"

export function LoginForm({
  className,
  systemName = "AdisyonEx",
  logoUrl = null,
  systemTagline = "Restoranınızın sipariş, stok ve adisyon yönetimini tek bir noktadan yönetin.",
  ...props
}: React.ComponentProps<"div"> & {
  readonly systemName?: string;
  readonly logoUrl?: string | null;
  readonly systemTagline?: string | null;
}) {
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const start = useServerAction(startLoginAction, {
    onSuccess: (data) => {
      setError(null)
      setStep(data?.method === "pin" ? "pin" : "code")
    },
    onError: (message) => setError(toAuthMessage(message)),
  })

  const sendCode = useServerAction(requestOtpAction, {
    onSuccess: () => {
      setError(null)
      setPin("")
      setStep("code")
    },
    onError: (message) => setError(toAuthMessage(message)),
  })

  const verifyPin = useServerAction(verifyPinAction, {
    redirectTo: "/dashboard/home",
    onError: (message) => {
      setError(toAuthMessage(message))
      if (message === "PIN_LOCKED") {
        sendCode.execute({ phone })
      }
    },
  })

  const verify = useServerAction(verifyOtpAction, {
    redirectTo: "/dashboard/home",
    onError: (message) => setError(toAuthMessage(message)),
  })

  const handlePhoneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = phoneSchema.safeParse(phone)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçerli bir telefon numarası girin")
      return
    }
    setError(null)
    start.execute({ phone })
  }

  const handlePinSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{4,6}$/.test(pin)) {
      setError("4–6 haneli PIN kodunuzu girin")
      return
    }
    setError(null)
    verifyPin.execute({ phone, pin })
  }

  const handleCodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError("6 haneli doğrulama kodunu girin")
      return
    }
    setError(null)
    verify.execute({ phone, code })
  }

  const changeNumber = () => {
    setPin("")
    setCode("")
    setError(null)
    setStep("phone")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2.5 text-center">
        {logoUrl ? (
          <div className="relative flex h-14 w-auto max-w-[200px] items-center justify-center overflow-hidden">
            <Image
              src={logoUrl}
              alt={systemName}
              width={160}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
            <Image
              src="/icon.png"
              alt={systemName}
              width={56}
              height={56}
              className="size-full object-contain"
            />
          </div>
        )}
        <h1 className="text-2xl font-black tracking-tight text-foreground">{systemName}&apos;e Giriş Yapın</h1>
        <FieldDescription>
          {systemTagline || "Restoranınızın sipariş, stok ve adisyon yönetimini tek bir noktadan yönetin."}
        </FieldDescription>
      </div>

      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phone">Telefon Numarası</FieldLabel>
              <PhoneInput
                id="phone"
                onChange={(value) => {
                  setPhone(value)
                  if (error) {
                    setError(null)
                  }
                }}
                invalid={Boolean(error)}
                disabled={start.isPending}
              />
              <FieldDescription>
                PIN kodunuzu girin veya size bir kerelik SMS kodu gönderelim.
              </FieldDescription>
              {error ? (
                <FieldDescription className="text-destructive">
                  {error}
                </FieldDescription>
              ) : null}
            </Field>
            <Field>
              <Button type="submit" disabled={start.isPending}>
                {start.isPending ? "Lütfen bekleyin…" : "Devam Et"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      ) : null}

      {step === "pin" ? (
        <form onSubmit={handlePinSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pin">PIN Kodu</FieldLabel>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                  if (error) {
                    setError(null)
                  }
                }}
                aria-invalid={error ? true : undefined}
                autoFocus
              />
              <FieldDescription>
                {phone} olarak giriş yapılıyor.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={changeNumber}
                >
                  Numarayı değiştir
                </button>
              </FieldDescription>
              {error ? (
                <FieldDescription className="text-destructive">
                  {error}
                </FieldDescription>
              ) : null}
            </Field>
            <Field>
              <Button type="submit" disabled={verifyPin.isPending}>
                {verifyPin.isPending ? "Doğrulanıyor…" : "Giriş Yap"}
              </Button>
              <FieldDescription className="text-center">
                PIN kodunuzu mu unuttunuz?{" "}
                <button
                  type="button"
                  className="underline"
                  disabled={sendCode.isPending}
                  onClick={() => sendCode.execute({ phone })}
                >
                  SMS kodu ile giriş yapın
                </button>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      ) : null}

      {step === "code" ? (
        <form onSubmit={handleCodeSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Doğrulama Kodu</FieldLabel>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  if (error) {
                    setError(null)
                  }
                }}
                aria-invalid={error ? true : undefined}
                autoFocus
              />
              <FieldDescription>
                {phone} numarasına gönderildi.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={changeNumber}
                >
                  Numarayı değiştir
                </button>
              </FieldDescription>
              {error ? (
                <FieldDescription className="text-destructive">
                  {error}
                </FieldDescription>
              ) : null}
            </Field>
            <Field>
              <Button type="submit" disabled={verify.isPending}>
                {verify.isPending ? "Doğrulanıyor…" : "Doğrula ve Devam Et"}
              </Button>
              <FieldDescription className="text-center">
                Kod gelmedi mi?{" "}
                <button
                  type="button"
                  className="underline"
                  disabled={sendCode.isPending}
                  onClick={() => sendCode.execute({ phone })}
                >
                  Kodu tekrar gönder
                </button>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      ) : null}

      <FieldDescription className="px-6 text-center">
        Devam ederek <a href="#">Kullanım Şartları</a> ve{" "}
        <a href="#">Gizlilik Politikası</a>&apos;nı kabul etmiş olursunuz.
      </FieldDescription>
    </div>
  )
}
