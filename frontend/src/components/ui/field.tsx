import { useId, type ComponentProps, type ReactNode } from 'react';
const inputClass =
  'w-full min-w-0 rounded-md border border-forest/25 bg-white p-3 text-sm focus:border-leaf focus:outline-none disabled:opacity-60';
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
      <label className="mb-2 block text-sm font-medium" htmlFor={fieldId}>
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
        <p id={fieldId + '-error'} className="mt-1 text-sm text-red-700">
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
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <select {...props} id={id} aria-invalid={!!error} className={inputClass}>
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
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
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <textarea
        {...props}
        id={id}
        aria-invalid={!!error}
        className={inputClass}
      />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
