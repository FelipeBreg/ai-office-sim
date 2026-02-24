'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full border border-border-default bg-bg-base px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-cyan focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
