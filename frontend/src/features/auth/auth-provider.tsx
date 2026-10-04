import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { adminSchema } from '../../lib/schemas';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import type { ConnectedWallet } from '../../chain/wallet';
import { signIn } from './auth-api';
import { AuthContext, type Session } from './auth-context';
export function AuthProvider({ children }: { children: ReactNode }) {
  const wallet = useConnectedWallet();
  const [storedSession, setSession] = useState<Session | null>(null);
  const session =
    storedSession?.admin.wallet === wallet?.address ? storedSession : null;
  const controller = useRef<AbortController | null>(null);
  const attempt = useRef(0);
  const queryClient = useQueryClient();
  const cancelAttempt = useCallback(() => {
    attempt.current++;
    controller.current?.abort();
  }, []);
  const logout = useCallback(() => {
    cancelAttempt();
    setSession(null);
    queryClient.removeQueries({ queryKey: ['admin'] });
  }, [cancelAttempt, queryClient]);
  const mutation = useMutation({
    mutationFn: async ({
      wallet,
      generation,
    }: {
      wallet: ConnectedWallet;
      generation: number;
    }) => {
      if (generation !== attempt.current)
        throw new DOMException('Wallet connection changed', 'AbortError');
      const current = new AbortController();
      controller.current = current;
      return { session: await signIn(wallet, current.signal), generation };
    },
    onSuccess: ({ session, generation }) => {
      if (generation === attempt.current) setSession(session);
    },
  });
  const { mutate, reset } = mutation;
  const retry = useCallback(() => {
    logout();
    reset();
    if (wallet) mutate({ wallet, generation: ++attempt.current });
  }, [wallet, logout, reset, mutate]);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        logout();
        reset();
      }
    });
    return () => {
      cancelled = true;
      cancelAttempt();
    };
  }, [wallet?.address, logout, reset, cancelAttempt]);
  useQuery({
    queryKey: ['admin', 'session', session?.admin.id],
    enabled: !!session,
    queryFn: async ({ signal }) => {
      try {
        if (!session) throw new Error('Admin session required');
        return await api('admin/me', adminSchema, {
          signal,
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status))
          logout();
        throw error;
      }
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(
      logout,
      Math.max(0, Date.parse(session.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [session, logout]);
  return (
    <AuthContext
      value={{
        session,
        isSigningIn: mutation.isPending,
        error: mutation.error,
        retry,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}
