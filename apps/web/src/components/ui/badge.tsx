import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'warning' | 'success' | 'error' | 'cyan';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border-border-default text-text-secondary',
  warning: 'border-status-warning text-status-warning',
  success: 'border-status-success text-status-success',
  error: 'border-status-error text-status-error',
  cyan: 'border-accent-cyan text-accent-cyan',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center border px-1 text-[10px] font-medium leading-4 ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
