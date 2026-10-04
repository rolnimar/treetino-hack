import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { readMockUsdcBalance } from '../../../chain/public';

export function useMockUsdc(address: string | undefined) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['wallet', 'mockUsdc', connection.rpcEndpoint, address],
    enabled: !!address,
    queryFn: async ({ signal }) => {
      if (!address) throw new Error('Wallet connection required');
      const balance = await readMockUsdcBalance(connection, address);
      signal.throwIfAborted();
      return balance;
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}
