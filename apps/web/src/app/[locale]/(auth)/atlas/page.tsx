'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useAtlasStore } from '@/stores/atlas-store';
import { useActiveProject } from '@/stores/project-store';
import { OrbVisualization } from '@/components/atlas/OrbVisualization';
import { TranscriptPanel } from '@/components/atlas/TranscriptPanel';
import type { AtlasState } from '@/stores/atlas-store';

/** Mock ATLAS responses keyed by input substring match (case-insensitive). */
const MOCK_RESPONSES: Record<string, string> = {
  mrr: 'O MRR atual é de R$ 127.400, um aumento de 12% em relação ao mês anterior. O churn está em 2.1%, abaixo da meta de 3%.',
  risco: 'Os 3 maiores riscos identificados são: (1) dependência de um único canal de aquisição, (2) backlog de tech debt no módulo de pagamentos, (3) rotatividade acima da média no time de suporte.',
  priorizar: 'Recomendo priorizar esta semana: (1) Fechar o deal com a Empresa X — potencial de R$ 45k ARR, (2) Corrigir o bug crítico no fluxo de checkout, (3) Publicar o case study para o blog.',
  risk: 'The top 3 risks identified are: (1) single acquisition channel dependency, (2) tech debt backlog in payments module, (3) above-average turnover in support team.',
  prioritize: 'This week I recommend prioritizing: (1) Close the deal with Company X — R$ 45k ARR potential, (2) Fix the critical checkout flow bug, (3) Publish the blog case study.',
  how: 'Current MRR is R$ 127,400, a 12% increase from last month. Churn is at 2.1%, below the 3% target.',
};

function getRandomResponse(): string {
  return 'Estou analisando os dados do projeto. Com base nos indicadores atuais, tudo parece estável. Posso detalhar qualquer métrica específica se necessário.';
}

function matchResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return getRandomResponse();
}

const STATE_LABEL_MAP: Record<AtlasState, { label: string; sub: string }> = {
  idle: { label: 'stateIdle', sub: 'stateIdleSub' },
  listening: { label: 'stateListening', sub: 'stateListeningSub' },
  thinking: { label: 'stateThinking', sub: 'stateThinkingSub' },
  speaking: { label: 'stateSpeaking', sub: 'stateSpeakingSub' },
};

const STATE_COLOR_MAP: Record<AtlasState, string> = {
  idle: '#00C8E0',
  listening: '#34D399',
  thinking: '#4493F8',
  speaking: '#FBBF24',
};

export default function AtlasPage() {
  const t = useTranslations('atlas');
  const activeProject = useActiveProject();

  const atlasState = useAtlasStore((s) => s.state);
  const messages = useAtlasStore((s) => s.messages);
  const intensity = useAtlasStore((s) => s.intensity);
  const muted = useAtlasStore((s) => s.muted);
  const setAtlasState = useAtlasStore((s) => s.setState);
  const setIntensity = useAtlasStore((s) => s.setIntensity);
  const toggleMuted = useAtlasStore((s) => s.toggleMuted);
  const addMessage = useAtlasStore((s) => s.addMessage);
  const reset = useAtlasStore((s) => s.reset);

  const [input, setInput] = useState('');
  const intensityTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (intensityTimer.current) clearInterval(intensityTimer.current);
      if (responseTimer.current) clearTimeout(responseTimer.current);
    };
  }, []);

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

  // Mock response flow: user message -> thinking -> speaking -> idle
  const simulateResponse = useCallback(
    (userText: string) => {
      // Clear any in-flight response cycle before starting a new one
      if (responseTimer.current) clearTimeout(responseTimer.current);

      // Transition to thinking
      setAtlasState('thinking');
      stopIntensitySimulation();

      // After thinking delay, transition to speaking
      responseTimer.current = setTimeout(() => {
        const responseText = matchResponse(userText);
        addMessage('atlas', responseText);
        setAtlasState('speaking');
        startIntensitySimulation();

        // After speaking delay, back to idle
        const speakDuration = 2000 + Math.random() * 2000;
        responseTimer.current = setTimeout(() => {
          setAtlasState('idle');
          stopIntensitySimulation();
        }, speakDuration);
      }, 1500);
    },
    [setAtlasState, addMessage, startIntensitySimulation, stopIntensitySimulation],
  );

  // Handle mic toggle
  const handleMicToggle = useCallback(() => {
    if (atlasState === 'thinking' || atlasState === 'speaking') return;

    if (atlasState === 'listening') {
      // Stop listening — simulate sending a voice message
      setAtlasState('idle');
      stopIntensitySimulation();
    } else {
      // Start listening
      setAtlasState('listening');
      startIntensitySimulation();
    }
  }, [atlasState, setAtlasState, startIntensitySimulation, stopIntensitySimulation]);

  // Handle text send
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || atlasState === 'thinking' || atlasState === 'speaking') return;

    // If currently listening, stop first
    if (atlasState === 'listening') {
      stopIntensitySimulation();
    }

    addMessage('user', text);
    setInput('');
    simulateResponse(text);
  }, [input, atlasState, addMessage, stopIntensitySimulation, simulateResponse]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (text: string) => {
      if (atlasState === 'thinking' || atlasState === 'speaking') return;
      addMessage('user', text);
      simulateResponse(text);
    },
    [atlasState, addMessage, simulateResponse],
  );

  // Handle reset
  const handleReset = useCallback(() => {
    if (responseTimer.current) clearTimeout(responseTimer.current);
    stopIntensitySimulation();
    reset();
    setInput('');
  }, [reset, stopIntensitySimulation]);

  const stateLabels = STATE_LABEL_MAP[atlasState];
  const stateColor = STATE_COLOR_MAP[atlasState];
  const micDisabled = atlasState === 'thinking' || atlasState === 'speaking';
  const inputDisabled = atlasState === 'thinking' || atlasState === 'speaking';

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: '#0A0E14' }}>
      {/* Header bar */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-2"
        style={{ borderColor: 'rgba(0, 200, 224, 0.1)' }}
      >
        <div className="flex flex-col">
          <h1
            className="font-mono text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#00C8E0' }}
          >
            {t('title')}
          </h1>
          <p
            className="font-mono text-[8px] uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.3)' }}
          >
            {t('subtitle')}
            {activeProject ? ` · ${activeProject.name}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Volume toggle */}
          <button
            onClick={toggleMuted}
            className="flex h-6 w-6 items-center justify-center border transition-colors"
            style={{
              borderColor: 'rgba(0, 200, 224, 0.15)',
              color: muted ? 'rgba(255, 255, 255, 0.3)' : '#00C8E0',
              borderRadius: 0,
            }}
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
            className="flex h-6 w-6 items-center justify-center border transition-colors"
            style={{
              borderColor: 'rgba(0, 200, 224, 0.15)',
              color: 'rgba(255, 255, 255, 0.4)',
              borderRadius: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00C8E0';
              e.currentTarget.style.borderColor = 'rgba(0, 200, 224, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.borderColor = 'rgba(0, 200, 224, 0.15)';
            }}
            title={t('reset')}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main content: orb + transcript */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Orb area (fills remaining space) */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {/* Orb visualization */}
          <OrbVisualization state={atlasState} intensity={intensity} />

          {/* State label */}
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="font-mono text-[11px] font-bold uppercase tracking-widest"
              style={{ color: stateColor }}
            >
              {t(stateLabels.label)}
            </span>
            <span
              className="font-mono text-[8px] uppercase tracking-wider"
              style={{ color: 'rgba(255, 255, 255, 0.3)' }}
            >
              {t(stateLabels.sub)}
            </span>
          </div>

          {/* Mic button */}
          <button
            onClick={handleMicToggle}
            disabled={micDisabled}
            className="group flex h-12 w-12 items-center justify-center border-2 transition-all"
            style={{
              borderColor: micDisabled
                ? 'rgba(255, 255, 255, 0.1)'
                : atlasState === 'listening'
                  ? '#34D399'
                  : '#00C8E0',
              color: micDisabled
                ? 'rgba(255, 255, 255, 0.2)'
                : atlasState === 'listening'
                  ? '#34D399'
                  : '#00C8E0',
              backgroundColor:
                atlasState === 'listening' ? 'rgba(52, 211, 153, 0.08)' : 'transparent',
              borderRadius: 0,
              cursor: micDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {atlasState === 'listening' ? (
              <MicOff size={20} strokeWidth={1.5} />
            ) : (
              <Mic size={20} strokeWidth={1.5} />
            )}
          </button>

          {/* Mic hint */}
          <span
            className="font-mono text-[8px] uppercase tracking-wider"
            style={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            {atlasState === 'listening' ? t('micStop') : t('micStart')}
          </span>
        </div>

        {/* Right: Transcript panel */}
        <TranscriptPanel
          messages={messages}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onSuggestionClick={handleSuggestionClick}
          disabled={inputDisabled}
        />
      </div>
    </div>
  );
}
