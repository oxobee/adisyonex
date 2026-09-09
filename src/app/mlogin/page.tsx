import { getSystemSettings } from "@/services/system-setting.service";
import { RetroGrid } from "@/components/velora/retro-grid";
import { Ripple } from "@/components/velora/ripple";
import { MloginClient } from "./mlogin-client";

export const dynamic = "force-dynamic";

export default async function MLoginPage() {
  const settings = await getSystemSettings().catch(() => null);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900 text-foreground overflow-hidden select-none">
      {/* Arka plan animasyonu */}
      <RetroGrid opacity={0.15} />
      <Ripple circles={3} baseSize={240} className="opacity-25 pointer-events-none" />

      {/* Mobil Login Kartı */}
      <div className="relative z-10 w-full max-w-[390px] animate-in fade-in zoom-in-95 duration-200">
        <MloginClient
          systemName={settings?.systemName || "Oxonom POS"}
          logoUrl={settings?.logoUrl ?? null}
          systemTagline={settings?.systemTagline ?? "Yönetici & Patron Mobil Paneli"}
        />

        {/* Alt Güvenlik & Marka Bilgisi */}
        <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-slate-400">
          <span>🔒 256-Bit SSL Şifreli Giriş</span>
          <span>·</span>
          <span>Oxonom Patron Mobil</span>
        </div>
      </div>
    </div>
  );
}
