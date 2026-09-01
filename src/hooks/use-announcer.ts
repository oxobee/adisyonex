"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { pickTurkishVoice } from "@/lib/announce";

const STORAGE_KEY = "restro.announce";

/** Distinct alert tones used when speech synthesis is unavailable. */
export type AlertTone = "beep" | "boop";

type AudioCtor = typeof AudioContext;

interface TonePulse {
  readonly freq: number;
  readonly start: number;
  readonly duration: number;
}

// Web Audio fallback recipes: short, distinct patterns per role.
const TONE_PULSES: Record<AlertTone, readonly TonePulse[]> = {
  // Kitchen: two bright pulses that read as "new order".
  beep: [
    { freq: 880, start: 0, duration: 0.14 },
    { freq: 880, start: 0.2, duration: 0.14 },
  ],
  // Waiter: a soft falling two-note that reads as "ready".
  boop: [
    { freq: 520, start: 0, duration: 0.16 },
    { freq: 392, start: 0.17, duration: 0.22 },
  ],
};

const getAudioCtor = (): AudioCtor | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext
  );
};

/**
 * Turkish voice announcements via the browser's built-in Speech Synthesis engine,
 * with a Web Audio beep/boop fallback when no speech voice is available.
 */
export function useAnnouncer(): {
  readonly supported: boolean;
  readonly enabled: boolean;
  readonly toggle: () => void;
  readonly announce: (text: string, tone: AlertTone) => void;
} {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const hasVoicesRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const playTone = useCallback((tone: AlertTone): void => {
    const Ctor = getAudioCtor();
    if (!Ctor) {
      return;
    }
    const ctx = audioRef.current ?? (audioRef.current = new Ctor());
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const start = ctx.currentTime;
    for (const pulse of TONE_PULSES[tone]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = pulse.freq;
      const t0 = start + pulse.start;
      const t1 = t0 + pulse.duration;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    }
  }, []);

  const speak = useCallback((text: string): void => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.lang = "tr-TR";
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang || "tr-TR";
    }
    utterance.onerror = (event) => {
      if (event.error !== "canceled" && event.error !== "interrupted") {
        console.warn("[announce] speech failed:", event.error);
      }
    };
    utteranceRef.current = utterance;
    synth.cancel();
    if (synth.paused) {
      synth.resume();
    }
    synth.speak(utterance);
  }, []);

  // Unlock both engines inside a user gesture
  const prime = useCallback((): void => {
    const Ctor = getAudioCtor();
    if (Ctor) {
      const ctx = audioRef.current ?? (audioRef.current = new Ctor());
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hasSpeech = "speechSynthesis" in window;
    const hasAudio = getAudioCtor() !== undefined;

    let stopVoices: (() => void) | undefined;
    if (hasSpeech) {
      const synth = window.speechSynthesis;
      const loadVoices = (): void => {
        const voices = synth.getVoices();
        hasVoicesRef.current = voices.length > 0;
        voiceRef.current = pickTurkishVoice(voices);
      };
      loadVoices();
      synth.addEventListener("voiceschanged", loadVoices);
      stopVoices = () => synth.removeEventListener("voiceschanged", loadVoices);
    }

    const onGesture = (): void => prime();
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });

    const raf = requestAnimationFrame(() => {
      setSpeechSupported(hasSpeech);
      setAudioSupported(hasAudio);
      setEnabled(window.localStorage.getItem(STORAGE_KEY) !== "0");
    });

    return () => {
      cancelAnimationFrame(raf);
      stopVoices?.();
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, [prime]);

  const toggle = useCallback((): void => {
    setEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      if (next) {
        prime();
        if ("speechSynthesis" in window && hasVoicesRef.current) {
          speak("Sesli bildirimler açık");
        } else {
          playTone("beep");
        }
      } else if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, [prime, speak, playTone]);

  const announce = useCallback(
    (text: string, tone: AlertTone): void => {
      if (!enabled) {
        return;
      }
      // Prefer speech only when a voice is actually available; otherwise the
      // hi-IN utterance would be silent, so fall back to the tone.
      if (speechSupported && hasVoicesRef.current) {
        speak(text);
      } else if (audioSupported) {
        playTone(tone);
      }
    },
    [enabled, speechSupported, audioSupported, speak, playTone],
  );

  return {
    supported: speechSupported || audioSupported,
    enabled,
    toggle,
    announce,
  };
}
