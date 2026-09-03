"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const PERMISSION_PROMPT_KEY = "adisyonex_notification_permission_prompted";
const NOTIFICATION_COOLDOWN_MS = 1200;

const getToastContent = (toastElement: Element) => {
  const title = toastElement.querySelector("[data-title]")?.textContent?.trim();
  const description = toastElement
    .querySelector("[data-description]")
    ?.textContent?.trim();
  return {
    title: title || "AdisyonEx",
    body: description || title || "Yeni bir işlem tamamlandı.",
  };
};

const showDeviceNotification = async (title: string, body: string) => {
  if (Notification.permission !== "granted") return;

  const options: NotificationOptions = {
    body,
    icon: "/icon.png",
    badge: "/icon.png",
    tag: `adisyonex-${Date.now()}`,
    data: { url: window.location.href },
  };

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(title, options);
      return;
    }
  } catch {
    // The browser Notification API is a useful fallback for non-PWA sessions.
  }

  new Notification(title, options);
};

export function DeviceNotificationBridge() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    const requestPermission = async () => {
      const permission = await Notification.requestPermission();
      localStorage.setItem(PERMISSION_PROMPT_KEY, "true");

      if (permission === "granted") {
        toast.success("Cihaz bildirimleri açıldı", {
          description: "Önemli işlemler ekran üstünde ve cihazınızda gösterilecek.",
        });
      } else {
        toast.message("Cihaz bildirimleri kapalı", {
          description: "Daha sonra tarayıcı ayarlarından açabilirsiniz.",
        });
      }
    };

    let permissionTimer: number | undefined;
    if (
      Notification.permission === "default" &&
      !localStorage.getItem(PERMISSION_PROMPT_KEY)
    ) {
      permissionTimer = window.setTimeout(() => {
        toast.message("Cihaz bildirimlerini açın", {
          id: "notification-permission",
          description: "Önemli işlem bildirimlerini cihazınızda da alın.",
          duration: 10000,
          action: {
            label: "Bildirimleri Aç",
            onClick: () => void requestPermission(),
          },
          cancel: {
            label: "Şimdi değil",
            onClick: () => localStorage.setItem(PERMISSION_PROMPT_KEY, "true"),
          },
        });
      }, 1800);
    }

    const processed = new WeakSet<Element>();
    let lastDeviceNotificationAt = 0;
    const announceToast = (toastElement: Element) => {
      if (processed.has(toastElement)) return;
      processed.add(toastElement);

      window.setTimeout(() => {
        const now = Date.now();
        if (now - lastDeviceNotificationAt < NOTIFICATION_COOLDOWN_MS) return;
        const { title, body } = getToastContent(toastElement);
        lastDeviceNotificationAt = now;
        void showDeviceNotification(title, body);
      }, 0);
    };

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches("[data-sonner-toast]")) announceToast(node);
          node.querySelectorAll("[data-sonner-toast]").forEach(announceToast);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll("[data-sonner-toast]").forEach(announceToast);
    return () => {
      if (permissionTimer !== undefined) window.clearTimeout(permissionTimer);
      observer.disconnect();
    };
  }, []);

  return null;
}
