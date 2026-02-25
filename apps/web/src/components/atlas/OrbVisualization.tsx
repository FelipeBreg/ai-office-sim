'use client';

import { useEffect, useRef, memo } from 'react';
import type { AtlasState } from '@/stores/atlas-store';

interface OrbVisualizationProps {
  state: AtlasState;
  intensity: number;
}

const COLOR_MAP: Record<AtlasState, [number, number, number]> = {
  idle: [0, 200, 224],
  listening: [52, 211, 153],
  thinking: [68, 147, 248],
  speaking: [251, 191, 36],
};

function OrbVisualizationBase({ state, intensity }: OrbVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrame = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Store state and intensity in refs so the animation loop always reads
  // the latest values without re-running the effect on every change
  const stateRef = useRef(state);
  const intensityRef = useRef(intensity);
  stateRef.current = state;
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);
    const center = size / 2;
    const baseRadius = 90;

    let lastTimestamp = 0;

    function draw(timestamp: number) {
      const delta = Math.min(lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0.016, 0.1);
      lastTimestamp = timestamp;
      timeRef.current += delta;
      const t = timeRef.current;
      ctx!.clearRect(0, 0, size, size);

      const currentState = stateRef.current;
      const currentIntensity = intensityRef.current;
      const [r, g, b] = COLOR_MAP[currentState];

      // Pulse config per state
      let pulseSpeed = 1;
      let pulseAmplitude = 0.03;
      let waveCount = 0;

      if (currentState === 'idle') {
        pulseSpeed = 0.8;
        pulseAmplitude = 0.04;
      } else if (currentState === 'listening') {
        pulseSpeed = 1.5;
        pulseAmplitude = 0.08 + currentIntensity * 0.12;
        waveCount = 3;
      } else if (currentState === 'thinking') {
        pulseSpeed = 2.5;
        pulseAmplitude = 0.06;
        waveCount = 5;
      } else if (currentState === 'speaking') {
        pulseSpeed = 1.2;
        pulseAmplitude = 0.05 + currentIntensity * 0.15;
        waveCount = 4;
      }

      const pulse = 1 + Math.sin(t * pulseSpeed * Math.PI) * pulseAmplitude;

      // Outer glow rings (4 layers)
      for (let ring = 4; ring >= 0; ring--) {
        const ringRadius = baseRadius * pulse + ring * 18;
        const alpha = 0.03 - ring * 0.005;
        ctx!.beginPath();
        ctx!.arc(center, center, ringRadius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
        ctx!.fill();
      }

      // Wave distortion ring
      if (waveCount > 0) {
        ctx!.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.02) {
          const waveOffset =
            Math.sin(angle * waveCount + t * pulseSpeed * 3) * (4 + currentIntensity * 8);
          const wR = baseRadius * pulse + waveOffset;
          const x = center + Math.cos(angle) * wR;
          const y = center + Math.sin(angle) * wR;
          if (angle === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.closePath();
        ctx!.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
        ctx!.lineWidth = 1;
        ctx!.stroke();
      }

      // Main orb gradient
      const gradient = ctx!.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        baseRadius * pulse,
      );
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.06)`);
      gradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, 0.03)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx!.beginPath();
      ctx!.arc(center, center, baseRadius * pulse, 0, Math.PI * 2);
      ctx!.fillStyle = gradient;
      ctx!.fill();

      // Main orb border (with wave distortion when active)
      ctx!.beginPath();
      if (waveCount > 0 && currentState !== 'idle') {
        for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
          const waveOffset =
            Math.sin(angle * waveCount + t * pulseSpeed * 3) * (2 + currentIntensity * 5);
          const wR = baseRadius * pulse + waveOffset;
          const x = center + Math.cos(angle) * wR;
          const y = center + Math.sin(angle) * wR;
          if (angle === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.closePath();
      } else {
        ctx!.arc(center, center, baseRadius * pulse, 0, Math.PI * 2);
      }
      ctx!.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
      ctx!.lineWidth = 1;
      ctx!.stroke();

      // Inner core glow
      const coreGradient = ctx!.createRadialGradient(center, center, 0, center, center, 20);
      coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.3 + currentIntensity * 0.2})`);
      coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx!.beginPath();
      ctx!.arc(center, center, 20, 0, Math.PI * 2);
      ctx!.fillStyle = coreGradient;
      ctx!.fill();

      // Orbiting particles
      const particleCount = currentState === 'idle' ? 3 : currentState === 'thinking' ? 8 : 5;
      for (let i = 0; i < particleCount; i++) {
        const pAngle = t * (0.3 + i * 0.1) + (i * Math.PI * 2) / particleCount;
        const pRadius = baseRadius * pulse * (0.6 + Math.sin(t + i) * 0.3);
        const px = center + Math.cos(pAngle) * pRadius;
        const py = center + Math.sin(pAngle) * pRadius;
        const pSize = 1.5 + Math.sin(t * 2 + i) * 0.5;
        ctx!.beginPath();
        ctx!.arc(px, py, pSize, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.4 + Math.sin(t + i) * 0.2})`;
        ctx!.fill();
      }

      animFrame.current = requestAnimationFrame(draw);
    }

    animFrame.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-[320px] w-[320px]"
      style={{ imageRendering: 'auto' }}
    />
  );
}

export const OrbVisualization = memo(OrbVisualizationBase);
OrbVisualization.displayName = 'OrbVisualization';
