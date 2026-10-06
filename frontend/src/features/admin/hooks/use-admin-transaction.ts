import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminChainClient } from '../../../chain/client';
import type { AdminAction } from '../schemas';
import { useAuth } from '../../auth/auth-context';
import { api } from '../../../lib/api';
import { adminSchema } from '../../../lib/schemas';
export function useAdminTransaction(client: AdminChainClient) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [signature, setSignature] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const mutation = useMutation({
    mutationFn: async (action: AdminAction) => {
      if (!session) throw new Error('Admin login required');
      const current = new AbortController();
      controller.current = current;
      setSignature(null);
      await api('admin/me', adminSchema, {
        signal: current.signal,
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      return client.execute(
        session.connected,
        action,
        setSignature,
        current.signal,
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trees'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'protocol'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
        queryClient.invalidateQueries({ queryKey: ['tree-reports'] }),
        queryClient.invalidateQueries({ queryKey: ['mock-reporter-status'] }),
      ]);
    },
    retry: false,
  });
  return { ...mutation, signature };
}
