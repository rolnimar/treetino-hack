import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { readTreeRewards } from '../../../chain/rewards';
import type { IndexedTree } from '../../../lib/schemas';

export function useTreeRewards(tree: IndexedTree, wallet: string | undefined) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: [
      'wallet',
      'treeRewards',
      connection.rpcEndpoint,
      wallet,
      tree.address,
    ],
    enabled: !!wallet,
    queryFn: async ({ signal }) => {
      if (!wallet) throw new Error('Connect your wallet first');
      const result = await readTreeRewards(connection, wallet, tree);
      signal.throwIfAborted();
      return result;
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}
