"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-9 rounded-xl border border-border/50 text-muted-foreground opacity-60", className)}
        disabled
        aria-label="Tema Değiştir"
      >
        <SunIcon className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "size-9 rounded-xl border border-border/60 bg-background/80 hover:bg-muted text-foreground transition-all duration-200 active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer",
        isDark && "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
        className
      )}
      title={isDark ? "Aydınlık Moda Geç" : "Karanlık Mod (Dark Mode) Aç"}
      aria-label={isDark ? "Aydınlık Mod" : "Karanlık Mod"}
    >
      {isDark ? (
        <SunIcon className="size-4 transition-transform duration-300 rotate-0 scale-100 text-amber-400" />
      ) : (
        <MoonIcon className="size-4 transition-transform duration-300 rotate-0 scale-100 text-slate-700" />
      )}
    </Button>
  );
}
