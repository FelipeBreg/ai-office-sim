'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-cyan text-bg-deepest hover:bg-accent-cyan-hover active:opacity-90',
  secondary:
    'border border-border-default bg-transparent text-text-primary hover:border-border-hover hover:bg-bg-overlay',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary',
  danger:
    'border border-status-error/40 bg-transparent text-status-error hover:bg-status-error/10',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-xs',
  lg: 'px-4 py-2 text-xs',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-cyan disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
