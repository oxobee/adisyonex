"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function GlobalEscNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      // 1. If an active modal, dialog, sheet or popover is open, let it close first
      const openDialog = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], .esc-modal-open'
      );
      if (openDialog) {
        return;
      }

      // 2. If the user is currently typing in an input/textarea and has text selected, let them escape focus first
      const activeElement = document.activeElement;
      const isInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).isContentEditable);

      if (isInput) {
        // Blur the input first
        (activeElement as HTMLElement).blur();
        return;
      }

      // 3. Navigate back to /dashboard/home if not already there
      if (pathname && pathname !== "/dashboard/home" && pathname !== "/dashboard") {
        e.preventDefault();
        router.push("/dashboard/home");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return null;
}
