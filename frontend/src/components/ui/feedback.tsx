export function ErrorMessage({ error }: { error: Error | null | undefined }) {
  return error ? (
    <p
      role="alert"
      className="my-3 rounded-md bg-red-50 p-3 text-sm text-red-800 break-words"
    >
      {error.message}
    </p>
  ) : null;
}
export function AddressLink({ address }: { address: string }) {
  return (
    <a
      href={`https://solscan.io/account/${address}?cluster=devnet`}
      target="_blank"
      rel="noreferrer"
      className="block text-xs text-forest/75 underline decoration-forest/25 break-all hover:text-forest"
    >
      {address}
    </a>
  );
}
