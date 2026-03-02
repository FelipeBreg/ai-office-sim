import { FeatureList } from '../../_components/reference-components';

export function SimMapping({ items }: { items: string[] }) {
  return (
    <div className="mb-6 border-l-2 border-accent-cyan bg-bg-base p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-accent-cyan">
        Como automatizar no AI Office Sim
      </p>
      <div className="-mb-6">
        <FeatureList items={items} />
      </div>
    </div>
  );
}
