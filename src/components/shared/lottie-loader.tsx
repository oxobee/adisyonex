"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

export const DEFAULT_LOTTIE_URL =
  "https://lottie.host/ce617471-a924-48a8-803c-dba890080c9f/7s7DXDPuXH.lottie";

export function LottieLoader({
  src = DEFAULT_LOTTIE_URL,
  className,
  size = "md",
  text = "Yükleniyor…",
}: {
  readonly src?: string;
  readonly className?: string;
  readonly size?: "sm" | "md" | "lg" | "fullscreen";
  readonly text?: string | null;
}) {
  const sizeClasses = {
    sm: "size-20 sm:size-24",
    md: "size-32 sm:size-40",
    lg: "size-48 sm:size-56",
    fullscreen: "size-40 sm:size-52",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 text-center select-none",
        size === "fullscreen" && "min-h-[50vh] w-full",
        className,
      )}
    >
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        <DotLottieReact
          src={src}
          loop
          autoplay
          className="size-full object-contain"
        />
      </div>
      {text && (
        <p className="text-xs sm:text-sm font-bold text-muted-foreground animate-pulse tracking-wide">
          {text}
        </p>
      )}
    </div>
  );
}
