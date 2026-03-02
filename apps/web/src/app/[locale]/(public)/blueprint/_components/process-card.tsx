type Periodicity = 'diario' | 'semanal' | 'mensal' | 'trimestral' | 'anual' | 'por-demanda';

const periodicityConfig: Record<Periodicity, { label: string; color: string }> = {
  diario: { label: 'Diário', color: 'border-status-success text-status-success' },
  semanal: { label: 'Semanal', color: 'border-blue-500 text-blue-400' },
  mensal: { label: 'Mensal', color: 'border-accent-cyan text-accent-cyan' },
  trimestral: { label: 'Trimestral', color: 'border-yellow-500 text-yellow-400' },
  anual: { label: 'Anual', color: 'border-text-muted text-text-muted' },
  'por-demanda': { label: 'Por Demanda', color: 'border-text-secondary text-text-secondary' },
};

export function ProcessCard({
  periodicity,
  tools,
  legal,
}: {
  periodicity: Periodicity;
  tools: string[];
  legal?: string;
}) {
  const p = periodicityConfig[periodicity];
  return (
    <div className="mb-6 border border-border-default bg-bg-base p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-muted">Periodicidade:</span>
        <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${p.color}`}>
          {p.label}
        </span>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <span className="shrink-0 text-text-muted">Ferramentas:</span>
        <span className="text-text-secondary">{tools.join(', ')}</span>
      </div>
      {legal && (
        <div className="flex items-start gap-2 text-sm">
          <span className="shrink-0 text-text-muted">Base Legal:</span>
          <span className="text-text-secondary">{legal}</span>
        </div>
      )}
    </div>
  );
}
