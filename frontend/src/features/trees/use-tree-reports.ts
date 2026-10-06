import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  treeReportsResponseSchema,
  type ClientSession,
} from '../../lib/schemas';

export const REPORT_PAGE_SIZE = 20;
export function useTreeReports(
  tree: string,
  page = 0,
  enabled = true,
  client?: ClientSession,
) {
  return useQuery({
    queryKey: ['tree-reports', tree, page, client?.accessToken ?? 'public'],
    queryFn: ({ signal }) =>
      api(
        `${client ? 'client/' : ''}trees/${tree}/reports?limit=${REPORT_PAGE_SIZE}&offset=${page * REPORT_PAGE_SIZE}`,
        treeReportsResponseSchema,
        {
          signal,
          ...(client
            ? { headers: { Authorization: `Bearer ${client.accessToken}` } }
            : {}),
        },
      ),
    enabled,
    refetchInterval: 10_000,
    retry: client ? false : undefined,
  });
}
