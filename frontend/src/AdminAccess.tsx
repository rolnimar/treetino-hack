import { useEffect, useRef, useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import type { Wallet } from '@wallet-standard/base';
import type {
  StandardConnectFeature,
  StandardEventsFeature,
} from '@wallet-standard/features';
import type { SolanaSignMessageFeature } from '@solana/wallet-standard-features';
import bs58 from 'bs58';

type SigningWallet = Wallet & {
  features: StandardConnectFeature &
    StandardEventsFeature &
    SolanaSignMessageFeature;
};
type Session = {
  accessToken: string;
  expiresAt: string;
  admin: { id: string; wallet: string };
};
async function api<T>(
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Request failed');
  return data as T;
}

export function AdminAccess() {
  const [wallets, setWallets] = useState<SigningWallet[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const unsubscribe = useRef<(() => void) | null>(null);
  function logout() {
    generation.current++;
    unsubscribe.current?.();
    unsubscribe.current = null;
    setSession(null);
  }
  useEffect(() => {
    const registry = getWallets();
    const refresh = () =>
      setWallets(
        registry
          .get()
          .filter(
            (wallet): wallet is SigningWallet =>
              'standard:connect' in wallet.features &&
              'standard:events' in wallet.features &&
              'solana:signMessage' in wallet.features,
          ),
      );
    refresh();
    const offRegister = registry.on('register', refresh);
    const offUnregister = registry.on('unregister', refresh);
    return () => {
      offRegister();
      offUnregister();
      generation.current++;
      unsubscribe.current?.();
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      () => {
        logout();
        setError('Session expired. Sign in again.');
      },
      Math.max(0, Date.parse(session.expiresAt) - Date.now()),
    );
    // Recheck membership while the admin panel is open, including after tab focus.
    const current = generation.current;
    const check = () => {
      void api('admin/me', undefined, session.accessToken).catch(() => {
        if (generation.current === current) {
          logout();
          setError('Admin session ended. Sign in again.');
        }
      });
    };
    const interval = setInterval(check, 60_000);
    window.addEventListener('focus', check);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('focus', check);
    };
  }, [session]);
  async function login(wallet: SigningWallet) {
    logout();
    const attempt = generation.current;
    setBusy(true);
    setError('');
    try {
      const { accounts } = await wallet.features['standard:connect'].connect();
      const account = accounts.find(
        (account) =>
          account.chains.some((chain) => chain.startsWith('solana:')) &&
          account.features.includes('solana:signMessage'),
      );
      if (!account)
        throw new Error(
          'This wallet has no Solana account that can sign messages.',
        );
      unsubscribe.current = wallet.features['standard:events'].on(
        'change',
        ({ accounts }) => {
          if (
            accounts &&
            !accounts.some((current) => current.address === account.address)
          )
            logout();
        },
      );
      const challenge = await api<{ id: string; message: string }>(
        'auth/challenge',
        { wallet: account.address },
      );
      if (attempt !== generation.current) return;
      const [signed] = await wallet.features['solana:signMessage'].signMessage({
        account,
        message: new TextEncoder().encode(challenge.message),
      });
      if (!signed || attempt !== generation.current) return;
      const result = await api<Session>('auth/login', {
        challengeId: challenge.id,
        wallet: account.address,
        signature: bs58.encode(signed.signature),
      });
      await api('admin/me', undefined, result.accessToken);
      if (attempt === generation.current) setSession(result);
    } catch (error) {
      if (attempt === generation.current) {
        logout();
        setError(
          error instanceof Error ? error.message : 'Wallet login failed',
        );
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-access" aria-label="Admin access">
      <div>
        <p className="eyebrow">{session ? 'ADMIN ACCESS' : 'PUBLIC ACCESS'}</p>
        <h2>
          {session ? 'Admin workspace' : 'Explore freely. Sign in to manage.'}
        </h2>
        <p>
          {session
            ? `Signed in as ${session.admin.wallet}`
            : 'Browsing and buying shares do not require an admin login. Approved admins can sign in with their wallet.'}
        </p>
      </div>
      {session ? (
        <>
          <p>
            Admin access is active. Tree management actions will appear here as
            they are added.
          </p>
          <button className="button" onClick={logout}>
            Sign out
          </button>
        </>
      ) : (
        <div className="wallet-buttons">
          {wallets.length ? (
            wallets.map((wallet, index) => (
              <button
                className="button"
                key={index}
                disabled={busy}
                onClick={() => void login(wallet)}
              >
                {busy ? 'Signing in…' : `Admin sign in · ${wallet.name}`}
              </button>
            ))
          ) : (
            <p>
              Open this site with a Solana wallet such as Phantom or Solflare to
              sign in as an admin.
            </p>
          )}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
