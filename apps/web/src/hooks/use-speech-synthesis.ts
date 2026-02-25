'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* -------------------------------------------------------------------------- */
/*  Hook interfaces                                                           */
/* -------------------------------------------------------------------------- */

export interface UseSpeechSynthesisOptions {
  /** BCP-47 locale string, e.g. 'pt-BR' or 'en-US'. Defaults to 'pt-BR'. */
  locale?: string;
  /** Speech rate. 1.0 is normal speed. Defaults to 1.0. */
  rate?: number;
  /** Speech pitch. 1.0 is normal pitch. Defaults to 1.0. */
  pitch?: number;
  /** Called when utterance playback starts. */
  onStart?: () => void;
  /** Called when utterance playback finishes. */
  onEnd?: () => void;
  /** Called on word/sentence boundaries with the character index. */
  onBoundary?: (charIndex: number) => void;
}

export interface UseSpeechSynthesisReturn {
  /** Whether the SpeechSynthesis API is available in this environment. */
  isSupported: boolean;
  /** Whether an utterance is currently being spoken. */
  isSpeaking: boolean;
  /** Speak the given text. Cancels any current speech first. */
  speak: (text: string) => void;
  /** Cancel the current speech immediately. */
  cancel: () => void;
  /** Available speech synthesis voices for the current environment. */
  voices: SpeechSynthesisVoice[];
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

/**
 * Find the best matching voice for a locale.
 * Tries exact match first (e.g. 'pt-BR'), then language prefix (e.g. 'pt'),
 * then falls back to the first available voice (or undefined).
 */
function findVoice(
  voices: SpeechSynthesisVoice[],
  locale: string,
): SpeechSynthesisVoice | undefined {
  if (voices.length === 0) return undefined;

  const lower = locale.toLowerCase();
  const prefix = lower.split('-')[0]!;

  // Exact locale match
  const exact = voices.find((v) => v.lang.toLowerCase() === lower);
  if (exact) return exact;

  // Language prefix match
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  // Fallback to first voice
  return voices[0];
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {},
): UseSpeechSynthesisReturn {
  const { locale = 'pt-BR', rate = 1.0, pitch = 1.0, onStart, onEnd, onBoundary } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Defer isSupported to after mount to avoid hydration mismatch
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    setIsSupported(getSynthesis() !== null);
  }, []);

  // Keep a stable reference to callbacks
  const callbacksRef = useRef({ onStart, onEnd, onBoundary });
  callbacksRef.current = { onStart, onEnd, onBoundary };

  // Load voices — some browsers (Chrome) fire `voiceschanged` async,
  // others (Firefox) have voices available immediately.
  useEffect(() => {
    const synth = getSynthesis();
    if (!synth) return;

    const loadVoices = () => {
      const available = synth.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    // Try to load immediately
    loadVoices();

    // Also listen for the async event
    synth.addEventListener('voiceschanged', loadVoices);

    return () => {
      synth.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Cancel any active speech on unmount
  useEffect(() => {
    return () => {
      const synth = getSynthesis();
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      const synth = getSynthesis();
      if (!synth) return;

      // Cancel any current speech before starting new
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Try to assign a matching voice
      const voice = findVoice(voices, locale);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        callbacksRef.current.onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        callbacksRef.current.onEnd?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        callbacksRef.current.onBoundary?.(event.charIndex);
      };

      synth.speak(utterance);
    },
    [locale, rate, pitch, voices],
  );

  const cancel = useCallback(() => {
    const synth = getSynthesis();
    if (!synth) return;

    synth.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isSupported,
    isSpeaking,
    speak,
    cancel,
    voices,
  };
}
