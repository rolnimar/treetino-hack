import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api, jsonBody } from '../../../lib/api';
import { mockReporterSchema, u64Schema } from '../../../lib/schemas';
import { useAuth } from '../../auth/auth-context';

export function usePrepareMockReporter(treeId: string, enabled: boolean) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['mock-reporter', session?.admin.wallet, treeId],
    queryFn: ({ signal }) =>
      api('admin/mock-reporters', mockReporterSchema, {
        ...jsonBody({ treeId }),
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session!.accessToken}`,
        },
      }),
    enabled: !!session && enabled && u64Schema.safeParse(treeId).success,
    staleTime: Infinity,
    retry: false,
  });
}
export function useMockReporter(tree: string) {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['mock-reporter-status', tree, session?.admin.wallet],
    queryFn: ({ signal }) =>
      api(
        `admin/trees/${tree}/mock-reporter`,
        z.object({ reporter: mockReporterSchema.nullable() }),
        {
          signal,
          headers: { Authorization: `Bearer ${session!.accessToken}` },
        },
      ).then(({ reporter }) => reporter),
    enabled: !!session,
    refetchInterval: 10_000,
  });
}
