"use client";

import Link from "next/link";
import {
  HomeIcon,
  AppsIcon,
  StorefrontIcon,
  UserCircleIcon,
} from "@/components/ui/icons";

interface BottomNavigationProps {
  activeTab?: "home" | "apps" | "store" | "profile";
  onTabChange?: (tab: "home" | "apps" | "store" | "profile") => void;
}

export function BottomNavigation({
  activeTab = "home",
  onTabChange,
}: BottomNavigationProps) {
  const tabs = [
    {
      id: "home" as const,
      label: "Ana Sayfa",
      icon: HomeIcon,
      href: "/boss",
    },
    {
      id: "apps" as const,
      label: "Uygulamalar",
      icon: AppsIcon,
      href: "/appstore",
    },
    {
      id: "store" as const,
      label: "Mağaza",
      icon: StorefrontIcon,
      href: "/store",
    },
    {
      id: "profile" as const,
      label: "Hesabım",
      icon: UserCircleIcon,
      href: "/account",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-safe pointer-events-none">
      <nav
        aria-label="Mobil Alt Navigasyon"
        className="pointer-events-auto w-full max-w-[420px] border-t border-slate-200/80 bg-white/95 px-6 py-2 backdrop-blur-xl shadow-lg"
      >
        <div className="flex items-center justify-between">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex min-h-[44px] min-w-[56px] flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon
                  size={20}
                  weight={isActive ? "fill" : "regular"}
                  className="transition-transform active:scale-90"
                />
                <span
                  className={`text-[10px] tracking-tight ${
                    isActive ? "font-bold text-indigo-600" : "font-medium text-slate-500"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
