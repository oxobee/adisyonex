"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  dismissCallSessionAction,
  getActiveRingingCallAction,
  getRecentMissedCallsAction,
} from "@/actions/telephony.actions";
import type { ActiveCallDTO, MissedCallDTO } from "@/services/telephony.service";

/**
 * Plays a pleasant, non-intrusive standard telephone ringtone chime using Web Audio API.
 */
function playPhoneRing() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Dual-tone Turkish/European telephone ring (400 Hz + 450 Hz)
    const tones = [400, 450];
    const ringDur = 1.2;

    tones.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + ringDur);
      gain.gain.exponentialRampToValueAtTime(0.001, now + ringDur + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + ringDur + 0.1);
    });
  } catch {
    // Ignore audio policy restrictions
  }
}

export function useTelephony({ enabled = true }: { enabled?: boolean } = {}) {
  const [activeCall, setActiveCall] = useState<ActiveCallDTO | null>(null);
  const [missedCalls, setMissedCalls] = useState<readonly MissedCallDTO[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMissedListOpen, setIsMissedListOpen] = useState(false);

  const lastSeenCallIdRef = useRef<string | null>(null);
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const dismissCall = useCallback(
    async (callId: string, status: "ANSWERED" | "ENDED" | "MISSED" = "ENDED") => {
      try {
        await dismissCallSessionAction(callId, status);
      } catch {
        // ignore
      }
    setActiveCall(null);
    setIsDrawerOpen(false);
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    // Refresh missed calls
    getRecentMissedCallsAction().then((res) => {
      if (res.success && res.data) setMissedCalls(res.data);
    });
  }, []);

  // Handle new incoming call (simulation or real)
  const handleIncomingCall = useCallback((call: ActiveCallDTO) => {
    setActiveCall(call);
    setIsDrawerOpen(true);
    playPhoneRing();

    // Ring every 3.5 seconds while ringing
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = setInterval(() => {
      playPhoneRing();
    }, 3500);
  }, []);

  // Listen for instant custom event (dispatched by simulation button)
  useEffect(() => {
    const onSimulatedCall = (e: Event) => {
      const custom = e as CustomEvent<ActiveCallDTO>;
      if (custom.detail) {
        lastSeenCallIdRef.current = custom.detail.id;
        handleIncomingCall(custom.detail);
      }
    };

    window.addEventListener("telephony-simulated-call", onSimulatedCall);
    return () => {
      window.removeEventListener("telephony-simulated-call", onSimulatedCall);
    };
  }, [handleIncomingCall]);

  // Periodic poller for real incoming calls & missed calls
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const poll = async () => {
      try {
        const [callRes, missedRes] = await Promise.all([
          getActiveRingingCallAction(),
          getRecentMissedCallsAction(),
        ]);

        if (!isMounted) return;

        if (missedRes.success && missedRes.data) {
          setMissedCalls(missedRes.data);
        }

        if (callRes.success && callRes.data) {
          const call = callRes.data;
          if (call.id !== lastSeenCallIdRef.current) {
            lastSeenCallIdRef.current = call.id;
            handleIncomingCall(call);
          }
        } else if (activeCall && !callRes.data) {
          // Call was ended or answered elsewhere
          setActiveCall(null);
          setIsDrawerOpen(false);
          if (ringIntervalRef.current) {
            clearInterval(ringIntervalRef.current);
            ringIntervalRef.current = null;
          }
        }
      } catch {
        // silent fail on network fluctuation
      }
    };

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (ringIntervalRef.current) {
        clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
    };
  }, [enabled, activeCall, handleIncomingCall]);

  return {
    activeCall,
    missedCalls,
    isDrawerOpen,
    setIsDrawerOpen,
    isMissedListOpen,
    setIsMissedListOpen,
    dismissCall,
    handleIncomingCall,
  };
}
