import type { ComponentProps } from 'react';
export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ComponentProps<'button'> & { variant?: 'primary' | 'secondary' }) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'primary' ? 'bg-forest text-white hover:bg-forest/90' : 'border border-forest/20 bg-transparent text-forest hover:bg-forest/5'} ${className}`}
    />
  );
}
