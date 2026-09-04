import Link from "next/link"
import { ChefHat, Home, LayoutDashboard, UtensilsCrossed } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner border border-primary/20 animate-in zoom-in-75 duration-300">
        <UtensilsCrossed className="h-12 w-12" />
        <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-xs font-black text-destructive-foreground shadow-md">
          404
        </span>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
        Sayfa Bulunamadı
      </h1>

      <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
        Ulaşmaya çalıştığınız sayfa taşınmış, silinmiş veya geçici olarak kullanım dışı olabilir. Lütfen adresi kontrol edin veya aşağıdaki bağlantılardan devam edin.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard/pos"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 active:scale-95"
        >
          <LayoutDashboard className="h-4 w-4" />
          Masalar & POS
        </Link>

        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95"
        >
          <ChefHat className="h-4 w-4" />
          Siparişler
        </Link>

        <Link
          href="/dashboard/home"
          className="inline-flex items-center gap-2 rounded-xl border border-input bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95"
        >
          <Home className="h-4 w-4" />
          Ana Panel
        </Link>
      </div>

      <div className="mt-12 text-xs text-muted-foreground">
        Adisyoon Akıllı Restoran Yönetim Sistemi
      </div>
    </div>
  )
}
