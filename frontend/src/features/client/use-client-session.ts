import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConnectedWallet } from '../../chain/wallet';
import { api, ApiError } from '../../lib/api';
import { clientSchema, type ClientSession } from '../../lib/schemas';
import { signInClient } from '../auth/auth-api';

export function useClientSession(wallet: ConnectedWallet | null) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const controller = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const logout = useCallback(() => {
    controller.current?.abort();
    setSession(null);
  }, []);
  useEffect(() => () => controller.current?.abort(), []);
  const login = useMutation({
    mutationFn: async () => {
      if (!wallet) throw new Error('Connect your wallet first');
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      return signInClient(wallet, current.signal);
    },
    onSuccess: setSession,
    retry: false,
  });
  const me = useQuery({
    queryKey: ['client', wallet?.address, session?.accessToken, 'me'],
    queryFn: async ({ signal }) => {
      try {
        return await api('client/me', clientSchema, {
          signal,
          headers: { Authorization: `Bearer ${session!.accessToken}` },
        });
      } catch (error) {
        if (
          !signal.aborted &&
          error instanceof ApiError &&
          [401, 403].includes(error.status)
        )
          logout();
        throw error;
      }
    },
    enabled: !!session,
    refetchInterval: 60_000,
    retry: false,
  });
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      logout,
      Math.max(0, Date.parse(session.expiresAt) - Date.now()),
    );
    return () => {
      window.clearTimeout(timer);
      void queryClient.cancelQueries({
        queryKey: ['client', session.client.wallet, session.accessToken],
      });
      queryClient.removeQueries({
        queryKey: ['client', session.client.wallet, session.accessToken],
      });
      const filter = {
        predicate: (query: { queryKey: readonly unknown[] }) =>
          query.queryKey[0] === 'tree-reports' &&
          query.queryKey[3] === session.accessToken,
      };
      void queryClient.cancelQueries(filter);
      queryClient.removeQueries(filter);
    };
  }, [session, queryClient, logout]);
  return { session, login, logout, error: me.error ?? login.error };
}
