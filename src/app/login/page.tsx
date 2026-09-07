import { LoginForm } from "@/components/login-form";
import { getSystemSettings } from "@/services/system-setting.service";
import { RetroGrid } from "@/components/velora/retro-grid";
import { Ripple } from "@/components/velora/ripple";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getSystemSettings().catch(() => null);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-background text-foreground overflow-hidden">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* RetroGrid + Ripple Ambient Backgrounds */}
      <RetroGrid opacity={0.35} />
      <Ripple circles={4} baseSize={220} className="opacity-30" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in zoom-in-98 duration-300">
        <LoginForm
          systemName={settings?.systemName || "Oxonom POS"}
          logoUrl={settings?.logoUrl ?? null}
          systemTagline={settings?.systemTagline ?? null}
        />

        {/* Güvenlik & Bulut Etiketi */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-muted-foreground">
          <span>🔒 256-Bit SSL Uçtan Uca Güvenli Giriş</span>
          <span>·</span>
          <span>Oxonom POS Bulut Restoran</span>
        </div>
      </div>
    </div>
  );
}
