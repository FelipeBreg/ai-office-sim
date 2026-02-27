'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useAtlasStore } from '@/stores/atlas-store';
import { useActiveProject } from '@/stores/project-store';
import { trpc } from '@/lib/trpc/client';
import { OrbVisualization } from '@/components/atlas/OrbVisualization';
import { TranscriptPanel } from '@/components/atlas/TranscriptPanel';
import type { AtlasState } from '@/stores/atlas-store';

const STATE_LABEL_MAP: Record<AtlasState, { label: string; sub: string }> = {
  idle: { label: 'stateIdle', sub: 'stateIdleSub' },
  listening: { label: 'stateListening', sub: 'stateListeningSub' },
  thinking: { label: 'stateThinking', sub: 'stateThinkingSub' },
  speaking: { label: 'stateSpeaking', sub: 'stateSpeakingSub' },
};

/** Color classes per state — uses Tailwind tokens so theme changes apply */
const STATE_COLOR_CLASS: Record<AtlasState, string> = {
  idle: 'text-accent-cyan',
  listening: 'text-[#34D399]',
  thinking: 'text-[#4493F8]',
  speaking: 'text-[#FBBF24]',
};

export default function AtlasPage() {
  const t = useTranslations('atlas');
  const searchParams = useSearchParams();
  const activeProject = useActiveProject();

  const atlasState = useAtlasStore((s) => s.state);
  const messages = useAtlasStore((s) => s.messages);
  const intensity = useAtlasStore((s) => s.intensity);
  const muted = useAtlasStore((s) => s.muted);
  const pendingActions = useAtlasStore((s) => s.pendingActions);
  const setAtlasState = useAtlasStore((s) => s.setState);
  const setIntensity = useAtlasStore((s) => s.setIntensity);
  const toggleMuted = useAtlasStore((s) => s.toggleMuted);
  const addMessage = useAtlasStore((s) => s.addMessage);
  const addAction = useAtlasStore((s) => s.addAction);
  const approveAction = useAtlasStore((s) => s.approveAction);
  const rejectAction = useAtlasStore((s) => s.rejectAction);
  const reset = useAtlasStore((s) => s.reset);

  const [input, setInput] = useState('');
  const intensityTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const insightHandled = useRef(false);

  // tRPC chat mutation
  const chatMutation = trpc.atlas.chat.useMutation({
    onSuccess: (data) => {
      addMessage('atlas', data.text);

      // Create approval popups for any suggested actions
      for (const action of data.actions) {
        addAction(action);
      }

      setAtlasState('speaking');
      startIntensitySimulation();

      // After speaking animation, back to idle
      const speakDuration = 1500 + Math.random() * 1500;
      setTimeout(() => {
        setAtlasState('idle');
        stopIntensitySimulation();
      }, speakDuration);
    },
    onError: () => {
      addMessage('atlas', t('chatError'));
      setAtlasState('idle');
      stopIntensitySimulation();
    },
  });

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (intensityTimer.current) clearInterval(intensityTimer.current);
    };
  }, []);

  // Handle insight query param from strategy page
  useEffect(() => {
    if (insightHandled.current) return;
    const insightId = searchParams.get('insight');
    if (insightId) {
      insightHandled.current = true;
      const insightText = t('insightPrompt', { id: insightId });
      // Auto-send the insight as the first message
      setTimeout(() => {
        sendMessage(insightText);
      }, 500);
      // Clear the query param from URL without navigation
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Intensity simulation during listening/speaking
  const startIntensitySimulation = useCallback(() => {
    if (intensityTimer.current) clearInterval(intensityTimer.current);
    intensityTimer.current = setInterval(() => {
      setIntensity(0.3 + Math.random() * 0.7);
    }, 100);
  }, [setIntensity]);

  const stopIntensitySimulation = useCallback(() => {
    if (intensityTimer.current) {
      clearInterval(intensityTimer.current);
      intensityTimer.current = null;
    }
    setIntensity(0);
  }, [setIntensity]);

  // Send a message to Atlas (real LLM or mock fallback)
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      addMessage('user', text);
      setAtlasState('thinking');
      stopIntensitySimulation();

      // Build conversation history from existing messages
      const history = messages.map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      chatMutation.mutate({
        message: text,
        history: history.slice(-20), // Last 20 messages for context
      });
    },
    [messages, addMessage, setAtlasState, stopIntensitySimulation, chatMutation],
  );

  // Handle mic toggle
  const handleMicToggle = useCallback(() => {
    if (atlasState === 'thinking' || atlasState === 'speaking') return;

    if (atlasState === 'listening') {
      setAtlasState('idle');
      stopIntensitySimulation();
    } else {
      setAtlasState('listening');
      startIntensitySimulation();
    }
  }, [atlasState, setAtlasState, startIntensitySimulation, stopIntensitySimulation]);

  // Handle text send
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || atlasState === 'thinking' || atlasState === 'speaking') return;

    if (atlasState === 'listening') {
      stopIntensitySimulation();
    }

    setInput('');
    sendMessage(text);
  }, [input, atlasState, stopIntensitySimulation, sendMessage]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (text: string) => {
      if (atlasState === 'thinking' || atlasState === 'speaking') return;
      sendMessage(text);
    },
    [atlasState, sendMessage],
  );

  // Handle reset
  const handleReset = useCallback(() => {
    stopIntensitySimulation();
    reset();
    setInput('');
  }, [reset, stopIntensitySimulation]);

  const stateLabels = STATE_LABEL_MAP[atlasState];
  const stateColorClass = STATE_COLOR_CLASS[atlasState];
  const micDisabled = atlasState === 'thinking' || atlasState === 'speaking';
  const inputDisabled = atlasState === 'thinking' || atlasState === 'speaking';

  return (
    <div className="flex h-full flex-col bg-bg-deepest">
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-accent-cyan/10 px-4 py-2">
        <div className="flex flex-col">
          <h1 className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent-cyan">
            {t('title')}
          </h1>
          <p className="font-mono text-[8px] uppercase tracking-wider text-text-disabled">
            {t('subtitle')}
            {activeProject ? ` · ${activeProject.name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Volume toggle */}
          <button
            onClick={toggleMuted}
            className={`flex h-6 w-6 items-center justify-center border border-accent-cyan/15 transition-colors ${
              muted ? 'text-text-disabled' : 'text-accent-cyan'
            }`}
            title={muted ? t('unmute') : t('mute')}
          >
            {muted ? (
              <VolumeX size={12} strokeWidth={1.5} />
            ) : (
              <Volume2 size={12} strokeWidth={1.5} />
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="flex h-6 w-6 items-center justify-center border border-accent-cyan/15 text-text-muted transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan"
            title={t('reset')}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main content: orb + transcript */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Orb area */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <OrbVisualization state={atlasState} intensity={intensity} />

          {/* State label */}
          <div className="flex flex-col items-center gap-0.5">
            <span className={`font-mono text-[11px] font-bold uppercase tracking-widest ${stateColorClass}`}>
              {t(stateLabels.label)}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-wider text-text-disabled">
              {t(stateLabels.sub)}
            </span>
          </div>

          {/* Mic button */}
          <button
            onClick={handleMicToggle}
            disabled={micDisabled}
            className={`group flex h-12 w-12 items-center justify-center border-2 transition-all ${
              micDisabled
                ? 'cursor-not-allowed border-text-disabled/20 text-text-disabled/40'
                : atlasState === 'listening'
                  ? 'border-[#34D399] bg-[#34D399]/8 text-[#34D399]'
                  : 'border-accent-cyan text-accent-cyan'
            }`}
          >
            {atlasState === 'listening' ? (
              <MicOff size={20} strokeWidth={1.5} />
            ) : (
              <Mic size={20} strokeWidth={1.5} />
            )}
          </button>

          {/* Mic hint */}
          <span className="font-mono text-[8px] uppercase tracking-wider text-text-disabled">
            {atlasState === 'listening' ? t('micStop') : t('micStart')}
          </span>
        </div>

        {/* Right: Transcript panel */}
        <TranscriptPanel
          messages={messages}
          pendingActions={pendingActions}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onSuggestionClick={handleSuggestionClick}
          onApproveAction={approveAction}
          onRejectAction={rejectAction}
          disabled={inputDisabled}
        />
      </div>
    </div>
  );
}
