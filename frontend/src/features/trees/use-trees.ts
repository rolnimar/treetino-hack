import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { treesResponseSchema, type IndexedTree } from '../../lib/schemas';
export const TREE_PAGE_SIZE = 20;
export function useTrees(phase: IndexedTree['phase'] | 'all', page: number) {
  const parameters = new URLSearchParams({
    limit: String(TREE_PAGE_SIZE),
    offset: String(page * TREE_PAGE_SIZE),
  });
  if (phase !== 'all') parameters.set('phase', phase);
  return useQuery({
    queryKey: ['trees', phase, page],
    queryFn: ({ signal }) =>
      api(`trees?${parameters}`, treesResponseSchema, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  });
}
