'use client';

import { useState, useRef, useEffect, useId, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const positionStyles: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
};

export function Tooltip({ content, children, side = 'right' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  function show() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
  }

  function hide() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          id={tooltipId}
          className={`pointer-events-none absolute z-50 whitespace-nowrap border border-border-default bg-bg-overlay px-2 py-1 text-[10px] text-text-primary shadow-lg ${positionStyles[side]}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
