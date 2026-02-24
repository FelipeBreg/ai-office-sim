interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className = '' }: SeparatorProps) {
  return orientation === 'horizontal' ? (
    <div className={`h-px w-full bg-border-default ${className}`} role="separator" aria-orientation="horizontal" />
  ) : (
    <div className={`h-full w-px bg-border-default ${className}`} role="separator" aria-orientation="vertical" />
  );
}
