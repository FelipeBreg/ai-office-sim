'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AuthError]', error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <div className="flex h-14 w-14 items-center justify-center border border-status-error/30 bg-status-error/10">
        <AlertTriangle size={24} strokeWidth={1.2} className="text-status-error" />
      </div>
      <div className="text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-text-primary">
          SYSTEM ERROR
        </h2>
        <p className="mt-1.5 max-w-sm text-[10px] text-text-muted">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="mt-1 text-[8px] text-text-muted">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={reset}
        className="flex items-center gap-1.5 border border-border-default px-4 py-2 text-[10px] text-text-primary transition-colors hover:border-accent-cyan hover:text-accent-cyan"
      >
        <RefreshCw size={12} strokeWidth={1.5} />
        RETRY
      </button>
    </div>
  );
}
