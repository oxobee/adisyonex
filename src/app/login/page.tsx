import { LoginForm } from "@/components/login-form";
import { getSystemSettings } from "@/services/system-setting.service";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const settings = await getSystemSettings().catch(() => null);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#fafafa] overflow-hidden">
      {/* 
        UNTITLED UI AMBIENT LIGHT AURA & SUBTLE DOT GRID
      */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[650px] sm:size-[850px] rounded-full blur-[140px] opacity-35 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.09) 0%, rgba(245, 158, 11, 0.06) 45%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in zoom-in-98 duration-300">
        <LoginForm
          systemName={settings?.systemName || "AdisyonEx"}
          logoUrl={settings?.logoUrl ?? null}
          systemTagline={settings?.systemTagline ?? null}
        />

        {/* Güvenlik & Bulut Etiketi */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-gray-400">
          <span>🔒 256-Bit SSL Uçtan Uca Güvenli Giriş</span>
          <span>·</span>
          <span>Bulut Restoran POS</span>
        </div>
      </div>
    </div>
  );
}
