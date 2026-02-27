export default function RootNotFound() {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=JSON.parse(localStorage.getItem('ai-office-ui')||'{}');if(t.state&&t.state.theme==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-mono antialiased" style={{ background: 'var(--color-bg-deepest)' }}>
        <main className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-accent-cyan)' }}>404</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Page not found.</p>
          </div>
        </main>
      </body>
    </html>
  );
}
