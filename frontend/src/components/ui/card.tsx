import type { ReactNode } from 'react';

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl sm:rounded-3xl border border-black/10 bg-white p-6 sm:p-7 shadow-xs transition-all duration-200 hover:border-black/20 hover:shadow-md ${className}`}
    >
      {title && (
        <h3 className="mb-4 text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
