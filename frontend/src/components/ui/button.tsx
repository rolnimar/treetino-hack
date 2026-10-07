import type { ComponentProps } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'white' | 'outline' | 'slim';
}) {
  const base =
    'inline-flex cursor-pointer items-center justify-center rounded-xl text-center font-medium transition-all text-xs sm:text-sm px-4 py-2.5 min-h-10 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] select-none';

  const variants = {
    primary:
      'bg-t-blue text-white shadow-xs hover:bg-t-blue/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-accent',
    secondary:
      'bg-zinc-950 text-white shadow-xs hover:bg-black/90 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-800',
    white:
      'border border-black/10 bg-white text-zinc-900 shadow-2xs hover:bg-zinc-50 hover:border-black/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-t-blue',
    outline:
      'border border-black/15 bg-transparent text-zinc-800 hover:bg-black/5 hover:border-black/25',
    slim: 'bg-t-blue text-white min-h-9 py-1.5 px-3 text-xs hover:bg-t-blue/90 shadow-2xs',
  };

  return (
    <button
      {...props}
      type={type}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
    />
  );
}
