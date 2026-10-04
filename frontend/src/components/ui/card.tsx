import type { ReactNode } from 'react';
export function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-forest/15 bg-white/60 p-5 sm:p-6">
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      {children}
    </section>
  );
}
