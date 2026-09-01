import { LoginForm } from "@/components/login-form"
import { getSystemSettings } from "@/services/system-setting.service"

export default async function LoginPage() {
  const settings = await getSystemSettings().catch(() => null)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm
          systemName={settings?.systemName || "AdisyonEx"}
          logoUrl={settings?.logoUrl ?? null}
          systemTagline={settings?.systemTagline ?? null}
        />
      </div>
    </div>
  )
}
