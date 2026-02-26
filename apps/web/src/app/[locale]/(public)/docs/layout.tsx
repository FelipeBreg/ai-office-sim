import { Link } from '@/i18n/navigation';
import { ArrowLeft, Terminal, Zap } from 'lucide-react';
import DocsSidebar from './_components/docs-sidebar';

export default function DocsLayout({
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
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-accent-cyan" />
          <span className="font-mono text-sm font-bold text-accent-cyan">
            Documentation
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
        <DocsSidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-10 lg:px-12">
            {children}
          </div>

          {/* Footer CTA */}
          <div className="mx-auto max-w-4xl px-6 pb-10 lg:px-12">
            <div className="border border-border-default bg-bg-base p-8 text-center">
              <p className="mb-4 text-lg font-bold text-text-primary">Ready to try it?</p>
              <p className="mb-6 text-sm text-text-secondary">
                Create your AI office in minutes. No credit card required for alpha.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 border border-accent-cyan bg-accent-cyan-dim px-8 py-3 font-mono text-sm font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan hover:text-bg-deepest"
              >
                Get Started
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
