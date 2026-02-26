import { Link } from '@/i18n/navigation';
import {
  Bot,
  Zap,
  MessageSquare,
  Activity,
  ArrowRight,
  Terminal,
} from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Agents',
    description: 'Autonomous workers that think, plan, and execute tasks in your virtual office.',
  },
  {
    icon: Activity,
    title: 'Live Simulation',
    description: 'Watch your AI office operate in real-time with live status updates.',
  },
  {
    icon: Zap,
    title: 'Workflows',
    description: 'Build automated pipelines that chain tasks across agents and tools.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Integration',
    description: 'Connect your AI office to the outside world through WhatsApp.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-deepest text-text-primary">
      {/* Hero */}
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex items-center gap-3 text-accent-cyan">
          <Terminal className="h-8 w-8" />
          <span className="text-sm tracking-widest uppercase text-text-muted">
            v0.1 alpha
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          AI Office{' '}
          <span className="text-accent-cyan">Sim</span>
        </h1>

        <p className="mb-10 max-w-xl text-lg text-text-secondary">
          Spin up a virtual office powered by AI agents. Assign roles, automate
          workflows, and watch them collaborate — all from your browser.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 border border-accent-cyan bg-accent-cyan-dim px-8 py-3 font-mono text-sm font-semibold text-accent-cyan transition-colors hover:bg-accent-cyan hover:text-bg-deepest"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center gap-2 border border-border-default px-8 py-3 font-mono text-sm font-semibold text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-border-default px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-text-primary">
            {'>'} features
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="border border-border-default bg-bg-base p-6 transition-colors hover:border-border-hover"
              >
                <f.icon className="mb-3 h-6 w-6 text-accent-cyan" />
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-text-primary">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border-subtle px-6 py-8 text-center text-xs text-text-muted">
        AI Office Sim — alpha build
      </div>
    </div>
  );
}
