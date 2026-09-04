"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getLatestLiveAlertsAction, type LiveAlertDTO } from "@/actions/live-alerts.actions";

// Pleasant multi-tone chime for real-time restaurant alerts (Bell sound)
function playAlertChime(type?: LiveAlertDTO["type"]) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Frequencies tailored for alert types
    const baseFreqs =
      type === "WAITER_CALL"
        ? [659.25, 880.0, 1174.66] // Urgent E5 - A5 - D6
        : type === "BILL_REQUEST"
        ? [523.25, 659.25, 783.99] // C5 - E5 - G5
        : [587.33, 739.99, 880.0]; // D5 - F#5 - A5

    baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  } catch {
    // ignore audio block policy
  }
}

// Show native Web Notification if permitted
async function showNativePush(title: string, body: string, targetUrl: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: "/icon.png",
        badge: "/icon.png",
        data: { url: targetUrl },
      });
      return;
    }
  } catch {
    // fallback
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: "/icon.png",
      badge: "/icon.png",
    });
    notif.onclick = () => {
      window.focus();
      window.location.href = targetUrl;
    };
  } catch {
    // ignore
  }
}

export function GlobalRealtimeAlerts() {
  const router = useRouter();
  const seenAlertIdsRef = useRef<Set<string>>(new Set());
  const isInitialMountRef = useRef<boolean>(true);

  // Request notification permission once if not determined
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Prompt user politely on initial click or interaction
      const handleUserGesture = () => {
        Notification.requestPermission().catch(() => {});
        window.removeEventListener("click", handleUserGesture);
      };
      window.addEventListener("click", handleUserGesture, { once: true });
    }
  }, []);

  // Live polling for alerts every 5 seconds across all dashboard pages
  useEffect(() => {
    let isCancelled = false;

    const pollAlerts = async () => {
      try {
        const res = await getLatestLiveAlertsAction();
        if (!res.success || !res.data || isCancelled) return;

        const alerts = res.data;

        // On first run, record existing alerts as baseline so we don't spam old notifications
        if (isInitialMountRef.current) {
          isInitialMountRef.current = false;
          for (const a of alerts) {
            seenAlertIdsRef.current.add(a.id);
          }
          return;
        }

        // Detect newly arrived alerts
        for (const alert of alerts) {
          if (!seenAlertIdsRef.current.has(alert.id)) {
            seenAlertIdsRef.current.add(alert.id);

            // 1. Play sound chime
            playAlertChime(alert.type);

            // 2. Show native push notification
            void showNativePush(alert.title, alert.message, alert.targetUrl);

            // 3. Show interactive toast
            toast(alert.title, {
              description: alert.message,
              duration: 8000,
              action: {
                label: "Gör",
                onClick: () => router.push(alert.targetUrl),
              },
            });

            // 4. Dispatch event so local badges or modals can update
            window.dispatchEvent(new CustomEvent("new-urgent-alert", { detail: alert }));
          }
        }
      } catch {
        // silent fail on network hiccups
      }
    };

    // Run first check after 1 second
    const initialTimer = setTimeout(pollAlerts, 1000);

    // Poll every 4.5 seconds
    const interval = setInterval(pollAlerts, 4500);

    return () => {
      isCancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}
