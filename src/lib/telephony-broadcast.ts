/**
 * Cross-tab & In-tab Telephony Event Dispatcher
 * Enables instant popup and ringing of incoming calls across any open tab (e.g. POS tab, Settings tab, Orders tab).
 */
import type { ActiveCallDTO } from "@/services/telephony.service";

const BROADCAST_CHANNEL_NAME = "oxonom_telephony_channel";
const LOCAL_STORAGE_KEY = "oxonom_telephony_event_sync";

export type TelephonyBroadcastMessage =
  | { type: "INCOMING_CALL"; call: ActiveCallDTO }
  | { type: "DISMISS_CALL"; callId: string };

/**
 * Broadcasts an incoming call or call dismissal to all open browser tabs and current window.
 */
export function broadcastTelephonyEvent(message: TelephonyBroadcastMessage): void {
  if (typeof window === "undefined") return;

  // 1. In-tab custom DOM event (instant in current window)
  if (message.type === "INCOMING_CALL") {
    window.dispatchEvent(
      new CustomEvent("telephony-simulated-call", { detail: message.call })
    );
  } else if (message.type === "DISMISS_CALL") {
    window.dispatchEvent(
      new CustomEvent("telephony-dismiss-call", { detail: { callId: message.callId } })
    );
  }

  // 2. BroadcastChannel (standard modern cross-tab communication)
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage(message);
      setTimeout(() => channel.close(), 1000);
    }
  } catch (err) {
    console.warn("[Telephony] BroadcastChannel error:", err);
  }

  // 3. LocalStorage fallback (triggers 'storage' event in other tabs)
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ ...message, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage quota or disabled storage
  }
}

/**
 * Subscribes to incoming telephony broadcast messages from other tabs or this tab.
 */
export function subscribeTelephonyBroadcast(
  onMessage: (message: TelephonyBroadcastMessage) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  // BroadcastChannel listener
  let channel: BroadcastChannel | null = null;
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<TelephonyBroadcastMessage>) => {
        if (event.data && (event.data.type === "INCOMING_CALL" || event.data.type === "DISMISS_CALL")) {
          onMessage(event.data);
        }
      };
    }
  } catch (err) {
    console.warn("[Telephony] Failed to create BroadcastChannel listener:", err);
  }

  // LocalStorage cross-tab fallback listener
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && (parsed.type === "INCOMING_CALL" || parsed.type === "DISMISS_CALL")) {
          onMessage(parsed);
        }
      } catch {
        // ignore parse error
      }
    }
  };
  window.addEventListener("storage", onStorage);

  // In-tab CustomEvent listeners
  const onLocalSimCall = (e: Event) => {
    const custom = e as CustomEvent<ActiveCallDTO>;
    if (custom.detail) {
      onMessage({ type: "INCOMING_CALL", call: custom.detail });
    }
  };
  const onLocalDismiss = (e: Event) => {
    const custom = e as CustomEvent<{ callId: string }>;
    if (custom.detail) {
      onMessage({ type: "DISMISS_CALL", callId: custom.detail.callId });
    }
  };

  window.addEventListener("telephony-simulated-call", onLocalSimCall);
  window.addEventListener("telephony-dismiss-call", onLocalDismiss);

  return () => {
    channel?.close();
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("telephony-simulated-call", onLocalSimCall);
    window.removeEventListener("telephony-dismiss-call", onLocalDismiss);
  };
}
