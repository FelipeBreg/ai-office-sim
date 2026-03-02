export function SimMapping({ items }: { items: string[] }) {
  return (
    <div className="mb-6 border-l-2 border-accent-cyan bg-bg-base p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-accent-cyan">
        Como automatizar no AI Office Sim
      </p>
      <ul className="space-y-1 text-sm text-text-secondary">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent-cyan">{'>'}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
