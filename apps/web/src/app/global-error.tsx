'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0E14',
          color: '#fff',
          fontFamily: 'IBM Plex Mono, monospace',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '14px', letterSpacing: '0.15em', marginBottom: '8px' }}>
            CRITICAL ERROR
          </h1>
          <p style={{ fontSize: '10px', color: '#6B7280', maxWidth: '300px', margin: '0 auto' }}>
            {error.message || 'The application encountered an unrecoverable error.'}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              border: '1px solid #374151',
              background: 'transparent',
              color: '#fff',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            RELOAD
          </button>
        </div>
      </body>
    </html>
  );
}
