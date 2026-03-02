import { Link } from '@/i18n/navigation';
import { ArrowLeft, BookOpen, Zap } from 'lucide-react';
import BlueprintSidebar from './_components/blueprint-sidebar';

export default function BlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-bg-deepest text-text-primary">
      {/* Header */}
      <nav className="flex shrink-0 items-center justify-between border-b border-border-default px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent-cyan" />
          <span className="font-mono text-sm font-bold text-accent-cyan">
            Blueprint Empresarial
          </span>
        </div>
        <Link
          href="/sign-up"
          className="border border-accent-cyan bg-accent-cyan-dim px-4 py-1.5 font-mono text-xs font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan hover:text-bg-deepest"
        >
          Get Started
        </Link>
      </nav>

      {/* Body: sidebar + content */}
      <div className="flex min-h-0 flex-1">
        <BlueprintSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-10 lg:px-12">
            {children}
          </div>

          {/* Footer CTA */}
          <div className="mx-auto max-w-4xl px-6 pb-10 lg:px-12">
            <div className="border border-border-default bg-bg-base p-8 text-center">
              <p className="mb-4 text-lg font-bold text-text-primary">Automatize com o AI Office Sim</p>
              <p className="mb-6 text-sm text-text-secondary">
                Crie seu escritório virtual com agentes de IA que executam esses processos automaticamente.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 border border-accent-cyan bg-accent-cyan-dim px-8 py-3 font-mono text-sm font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan hover:text-bg-deepest"
              >
                Começar Agora
                <Zap className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border-subtle px-6 py-8 text-center text-xs text-text-muted">
            AI Office Sim — alpha build
            <div className="mt-2 text-text-disabled">Powered by Axis Brasil</div>
          </div>
        </main>
      </div>
    </div>
  );
}
