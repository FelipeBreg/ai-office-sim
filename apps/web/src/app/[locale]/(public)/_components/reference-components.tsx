import { AlertTriangle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Shared components used by /docs and /blueprint                     */
/* ------------------------------------------------------------------ */

export function StatusBadge({
  status,
}: {
  status: 'done' | 'partial' | 'stub' | 'planned';
}) {
  const colors = {
    done: 'border-status-success text-status-success',
    partial: 'border-status-warning text-status-warning',
    stub: 'border-status-error text-status-error',
    planned: 'border-text-muted text-text-muted',
  };
  const labels = {
    done: 'Complete',
    partial: 'Partial',
    stub: 'Stub',
    planned: 'Planned',
  };
  return (
    <span
      className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function SectionHeading({
  id,
  icon: Icon,
  title,
  status,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  status?: 'done' | 'partial' | 'stub' | 'planned';
}) {
  return (
    <h2
      id={id}
      className="mb-4 flex items-center gap-3 border-b border-border-default pb-3 text-xl font-bold text-text-primary"
    >
      <Icon className="h-5 w-5 text-accent-cyan" />
      {title}
      {status && (
        <span className="ml-auto">
          <StatusBadge status={status} />
        </span>
      )}
    </h2>
  );
}

export function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="mb-6 space-y-1.5 text-sm text-text-secondary">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-accent-cyan">{'>'}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LimitationList({ items }: { items: string[] }) {
  return (
    <div className="mb-6 border border-border-default bg-bg-base p-4">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-status-warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        Current Limitations
      </p>
      <ul className="space-y-1 text-sm text-text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-text-disabled">-</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QuickStart({ steps }: { steps: string[] }) {
  return (
    <div id="quickstart" className="mb-6 border border-border-default bg-bg-base p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent-cyan">
        Quickstart
      </p>
      <ol className="space-y-2 text-sm text-text-secondary">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 font-bold text-accent-cyan">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
