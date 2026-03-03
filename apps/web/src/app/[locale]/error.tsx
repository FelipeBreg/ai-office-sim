'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[LocaleError]', error);
  }, [error]);

  return (
    <html>
      <body className="flex h-screen items-center justify-center bg-[#0A0E14] font-mono text-white">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="flex h-14 w-14 items-center justify-center border border-red-500/30 bg-red-500/10">
            <AlertTriangle size={24} strokeWidth={1.2} className="text-red-400" />
          </div>
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em]">
              APPLICATION ERROR
            </h2>
            <p className="mt-1.5 max-w-sm text-[10px] text-gray-400">
              {error.message || 'Something went wrong. Please try again.'}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 border border-gray-600 px-4 py-2 text-[10px] transition-colors hover:border-cyan-400 hover:text-cyan-400"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            RETRY
          </button>
        </div>
      </body>
    </html>
  );
}
