import { useId, type ComponentProps, type ReactNode } from 'react';

const inputClass =
  'w-full min-w-0 rounded-xl border border-black/15 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-t-blue focus:ring-1 focus:ring-t-blue focus:outline-hidden transition shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed';

export function Field({
  label,
  error,
  id,
  ...props
}: ComponentProps<'input'> & { label: string; error?: string }) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-700"
        htmlFor={fieldId}
      >
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? fieldId + '-error' : undefined}
        className={inputClass}
      />
      {error && (
        <p
          id={fieldId + '-error'}
          className="mt-1 text-xs font-medium text-rose-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  error,
  children,
  ...props
}: ComponentProps<'select'> & {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-700"
        htmlFor={id}
      >
        {label}
      </label>
      <select {...props} id={id} aria-invalid={!!error} className={inputClass}>
        {children}
      </select>
      {error && (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}

export function TextareaField({
  label,
  error,
  ...props
}: ComponentProps<'textarea'> & { label: string; error?: string }) {
  const id = useId();
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-700"
        htmlFor={id}
      >
        {label}
      </label>
      <textarea
        {...props}
        id={id}
        aria-invalid={!!error}
        className={inputClass}
      />
      {error && (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      )}
    </div>
  );
}
