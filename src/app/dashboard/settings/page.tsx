import Link from "next/link"
import {
  ArrowRightIcon,
  CrownIcon,
  HeadphonesIcon,
  ImagesIcon,
  KeyRoundIcon,
  LayersIcon,
  MapPinIcon,
  PhoneCallIcon,
  PrinterIcon,
  QrCodeIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StoreIcon,
} from "lucide-react"

import { SalesRepCard } from "@/components/license/sales-rep-card"
import { GalleryManager } from "@/components/settings/gallery-manager"
import { InvoiceFooterCard } from "@/components/settings/invoice-footer-card"
import { LocationMapCard } from "@/components/settings/location-map-card"
import { ProfileHeader } from "@/components/settings/profile-header"
import { RestaurantProfileForm } from "@/components/settings/restaurant-profile-form"
import { ScreenLockPinCard } from "@/components/settings/screen-lock-pin-card"
import { SelfOrderCard } from "@/components/settings/self-order-card"
import { SignInPinCard } from "@/components/settings/sign-in-pin-card"
import { TaxSettingsForm } from "@/components/settings/tax-settings-form"
import { UsernameCard } from "@/components/settings/username-card"
import { VideosManager } from "@/components/settings/videos-manager"
import { TelephonySettingsTab } from "@/components/settings/telephony-settings-tab"
import { PrinterSettingsTab } from "@/components/settings/printer-settings-tab"
import { ChannelsSettingsTab } from "@/components/settings/channels-settings-tab"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { getManagerContextOrNull } from "@/lib/manager-auth"
import { getStaffContextOrNull } from "@/lib/staff-auth"
import { getAdminContextOrNull } from "@/lib/admin-auth"
import {
  getInvoiceFooterNote,
  getRestaurantProfile,
  getSelfOrderEnabled,
  getTaxProfile,
} from "@/services/restaurant-settings.service"
import { getTelephonySettings } from "@/services/telephony.service"
import { getPinStatus } from "@/services/pin-auth.service"
import { getRestaurantLicenseInfo } from "@/services/license.service"
import { prisma } from "@/lib/prisma"

const TABS = [
  { value: "profile", label: "İşletme Profili", icon: StoreIcon },
  { value: "printers", label: "Fiş & Yazıcı Ayarları", icon: PrinterIcon },
  { value: "channels", label: "Sipariş Kanalları", icon: LayersIcon },
  { value: "telephony", label: "Akıllı Telefon Sipariş", icon: PhoneCallIcon },
  { value: "license", label: "Lisans & Satış Temsilcisi", icon: HeadphonesIcon },
  { value: "location", label: "Konum & Harita", icon: MapPinIcon },
  { value: "ordering", label: "QR Menü & Sipariş", icon: QrCodeIcon },
  { value: "billing", label: "Fatura & Vergi", icon: ReceiptIcon },
  { value: "media", label: "Görseller & Medya", icon: ImagesIcon },
  { value: "access", label: "Giriş & Güvenlik", icon: KeyRoundIcon },
] as const

const NAV_TRIGGER =
  "h-auto w-full flex-none justify-start gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground data-active:bg-muted! data-active:text-foreground data-active:shadow-none!"

export default async function SettingsPage() {
  const ctx = await getManagerContextOrNull()
  const staffCtx = await getStaffContextOrNull()
  const restaurantId = staffCtx?.restaurantId || ctx?.restaurantId

  if (!restaurantId) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Ayarlar"
          description="Restoran ayarlarını ve yapılandırmasını yönetin."
        />
        <EmptyState
          title="Henüz restoran tanımlanmamış"
          description="Lütfen yöneticinizle iletişime geçin."
        />
      </div>
    )
  }

  const staff = staffCtx
    ? await prisma.staff.findUnique({
        where: { id: staffCtx.staffId },
        select: { allowedRoutes: true },
      })
    : null;

  const staffRoutes = staff?.allowedRoutes as string[] | null | undefined;
  const visibleTabs = TABS.filter((tab) => {
    if (!staffRoutes) return true;
    if (staffRoutes.includes("/dashboard/settings")) return true;
    return staffRoutes.includes(`/dashboard/settings#${tab.value}`);
  });

  if (visibleTabs.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Ayarlar"
          description="Restoran ayarlarını ve yapılandırmasını yönetin."
        />
        <EmptyState
          title="Erişim Yetkiniz Bulunmuyor"
          description="Bu ayarlar ekranına erişim yetkiniz bulunmamaktadır. Lütfen yöneticinizle iletişime geçin."
        />
      </div>
    );
  }

  const [profile, taxProfile, licenseInfo, adminCtx, telephonySettings, restaurantSettings] = await Promise.all([
    getRestaurantProfile(restaurantId),
    getTaxProfile(restaurantId),
    getRestaurantLicenseInfo(restaurantId).catch(() => null),
    getAdminContextOrNull().catch(() => null),
    getTelephonySettings(restaurantId),
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        name: true,
        receiptKitchenActive: true,
        receiptCourierActive: true,
        receiptCustomerActive: true,
        receiptMerchantActive: true,
      },
    }),
  ])
  const isSuperAdminUser = Boolean(adminCtx && adminCtx.isSuperAdmin)
  const pinStatus = ctx?.userId
    ? await getPinStatus(ctx.userId)
    : { hasPin: false, pinUpdatedAt: null }
  const selfOrderEnabled = await getSelfOrderEnabled(restaurantId)
  const invoiceFooter = await getInvoiceFooterNote(restaurantId)

  const essentials: (string | null)[] = [
    profile.name,
    profile.legalName,
    profile.logoUrl,
    profile.addressLine1,
    profile.city,
    profile.phone,
    profile.fssaiLicense,
  ]
  if (taxProfile.gstRegistrationType !== "UNREGISTERED") {
    essentials.push(taxProfile.gstin)
  }
  const completeness = {
    done: essentials.filter(Boolean).length,
    total: essentials.length,
  }

  const address =
    [
      profile.addressLine1,
      profile.addressLine2,
      profile.city,
      profile.state,
      profile.postalCode,
    ]
      .filter(Boolean)
      .join(", ") || null

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Ayarlar"
        description="Restoran profili, marka, konum, vergi ve erişim yapılandırması."
      />

      {isSuperAdminUser && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 rounded-3xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent border border-purple-500/30 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-xs shrink-0">
              <CrownIcon className="size-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-foreground">Süper Admin Yetkisi</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider">
                  ROOT
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Uğur UĞURLU hesabınız ile tüm restoranları ve sistem genelini Süper Admin Paneli üzerinden yönetebilirsiniz.
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/35 transition-all active:scale-95 shrink-0"
          >
            <span>Süper Admin Paneline Git</span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      )}

      <ProfileHeader profile={profile} completeness={completeness} />

      <Tabs
        defaultValue={visibleTabs[0]?.value || "profile"}
        orientation="vertical"
        className="flex-col gap-6 lg:flex-row lg:items-start"
      >
        <TabsList className="h-fit w-full flex-col gap-1 rounded-xl border bg-card p-2 lg:w-60 lg:shrink-0">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={NAV_TRIGGER}
              >
                <Icon className="size-4 shrink-0" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="min-w-0 flex-1">
          <TabsContent value="profile" keepMounted>
            <RestaurantProfileForm profile={profile} />
          </TabsContent>

          <TabsContent value="printers" keepMounted>
            <PrinterSettingsTab
              restaurantName={restaurantSettings?.name || profile.name}
              initialSettings={{
                receiptKitchenActive: restaurantSettings?.receiptKitchenActive ?? true,
                receiptCourierActive: restaurantSettings?.receiptCourierActive ?? true,
                receiptCustomerActive: restaurantSettings?.receiptCustomerActive ?? true,
                receiptMerchantActive: restaurantSettings?.receiptMerchantActive ?? true,
              }}
            />
          </TabsContent>

          <TabsContent value="channels" keepMounted>
            <ChannelsSettingsTab />
          </TabsContent>

          <TabsContent value="telephony" keepMounted>
            <TelephonySettingsTab
              initialSettings={telephonySettings}
              restaurantName={restaurantSettings?.name || profile.name}
            />
          </TabsContent>

          <TabsContent value="license" keepMounted className="flex flex-col gap-6">
            {/* License Details Header Card */}
            {licenseInfo && (
              <Card className="rounded-3xl border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black">Lisans & Abonelik Durumu</CardTitle>
                      <CardDescription>İşletmenizin mevcut lisans paketi ve kullanım süreleri.</CardDescription>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                      {licenseInfo.planLabel}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border bg-background/60 p-4">
                    <span className="block text-xs font-semibold text-muted-foreground">Kalan Lisans Süresi</span>
                    <span className="mt-1 block text-2xl font-black text-foreground">
                      {licenseInfo.plan === "LIFETIME" ? "Süresiz ♾️" : `${licenseInfo.daysRemaining} Gün`}
                    </span>
                  </div>
                  <div className="rounded-2xl border bg-background/60 p-4">
                    <span className="block text-xs font-semibold text-muted-foreground">AI Stüdyo Kredisi</span>
                    <span className="mt-1 block text-2xl font-black text-amber-600 dark:text-amber-400">
                      {licenseInfo.aiBalance} Kredi ✨
                    </span>
                  </div>
                  <div className="rounded-2xl border bg-background/60 p-4">
                    <span className="block text-xs font-semibold text-muted-foreground">Lisans Durumu</span>
                    <span className="mt-1 block text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {licenseInfo.statusLabel}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sales Representative Card */}
            <SalesRepCard salesRep={licenseInfo?.salesRep} />
          </TabsContent>

          <TabsContent value="location" keepMounted>
            <LocationMapCard
              latitude={profile.latitude}
              longitude={profile.longitude}
              address={address}
            />
          </TabsContent>

          <TabsContent value="ordering" keepMounted>
            <SelfOrderCard
              enabled={selfOrderEnabled}
              username={profile.username}
            />
          </TabsContent>

          <TabsContent
            value="billing"
            keepMounted
            className="flex flex-col gap-6"
          >
            <TaxSettingsForm profile={taxProfile} />
            <InvoiceFooterCard note={invoiceFooter} />
          </TabsContent>

          <TabsContent
            value="media"
            keepMounted
            className="flex flex-col gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Fotoğraflar</CardTitle>
                <CardDescription>
                  Restoranınız için vitrin fotoğraf galerisi (en fazla 8 adet).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GalleryManager gallery={profile.gallery} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Videolar</CardTitle>
                <CardDescription>
                  Tanıtım videoları bağlantısı (YouTube / Instagram / Vimeo) ekleyin veya video yükleyin (en fazla 6 adet).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideosManager videos={profile.videos} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="access"
            keepMounted
            className="flex flex-col gap-6"
          >
            <ScreenLockPinCard />
            <UsernameCard username={profile.username} />
            <SignInPinCard status={pinStatus} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

