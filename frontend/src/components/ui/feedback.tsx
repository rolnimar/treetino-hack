export function ErrorMessage({ error }: { error: Error | null | undefined }) {
  return error ? (
    <div
      role="alert"
      className="my-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800 break-words shadow-2xs"
    >
      <span className="font-semibold">Error: </span>
      {error.message}
    </div>
  ) : null;
}

export function AddressLink({ address }: { address: string }) {
  return (
    <a
      href={`https://solscan.io/account/${address}?cluster=devnet`}
      target="_blank"
      rel="noreferrer"
      className="block font-mono text-xs text-t-blue/80 underline decoration-t-blue/30 break-all transition hover:text-t-accent hover:decoration-t-accent"
    >
      {address}
    </a>
  );
}
