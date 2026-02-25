'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* -------------------------------------------------------------------------- */
/*  Web Speech API type declarations (not available in all TS libs)           */
/* -------------------------------------------------------------------------- */

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/* -------------------------------------------------------------------------- */
/*  Hook interfaces                                                           */
/* -------------------------------------------------------------------------- */

export interface UseSpeechRecognitionOptions {
  /** BCP-47 locale string, e.g. 'pt-BR' or 'en-US'. Defaults to 'pt-BR'. */
  locale?: string;
  /** Called with the latest transcript when a result is received. */
  onResult?: (transcript: string) => void;
  /** Called when a recognition error occurs. */
  onError?: (error: string) => void;
  /** Called when recognition ends (either naturally or via stopListening). */
  onEnd?: () => void;
}

export interface UseSpeechRecognitionReturn {
  /** Whether recognition is currently active. */
  isListening: boolean;
  /** Whether the Web Speech API is available in this environment. */
  isSupported: boolean;
  /** Start listening for speech. No-op if already listening or unsupported. */
  startListening: () => void;
  /** Stop listening. No-op if not listening. */
  stopListening: () => void;
  /** The most recent transcript (accumulates interim + final results). */
  transcript: string;
  /** The most recent error message, or null. */
  error: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;

  // Standard + webkit prefix (Chrome, Edge, Safari)
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | SpeechRecognitionConstructor
    | null;
}

const ERROR_MAP: Record<string, string> = {
  'no-speech': 'No speech was detected. Please try again.',
  'audio-capture': 'No microphone was found or microphone access was denied.',
  'not-allowed': 'Microphone permission was denied.',
  network: 'A network error occurred during recognition.',
  aborted: 'Speech recognition was aborted.',
  'language-not-supported': 'The requested language is not supported.',
  'service-not-allowed': 'The speech recognition service is not allowed.',
};

function mapError(code: string): string {
  return ERROR_MAP[code] ?? `Speech recognition error: ${code}`;
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const { locale = 'pt-BR', onResult, onError, onEnd } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Defer isSupported to after mount to avoid hydration mismatch
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    setIsSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Keep a stable reference to the callbacks so event handlers always see the
  // latest without needing to re-create the recognition instance.
  const callbacksRef = useRef({ onResult, onError, onEnd });
  callbacksRef.current = { onResult, onError, onEnd };

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    if (recognitionRef.current) return; // already listening

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = locale;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let accumulated = '';
      for (let i = 0; i < event.results.length; i++) {
        accumulated += event.results[i]![0]!.transcript;
      }
      setTranscript(accumulated);
      callbacksRef.current.onResult?.(accumulated);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg = mapError(event.error);
      setError(msg);
      callbacksRef.current.onError?.(msg);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      callbacksRef.current.onEnd?.();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // start() can throw if called while already started (race condition)
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isSupported, locale]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // onend handler will clean up state
    }
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    error,
  };
}
