import '../../chain/buffer';
import { useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { AdminChainClient } from '../../chain/client';
import { useAuth } from '../auth/auth-context';
import { useAdminTransaction } from './hooks/use-admin-transaction';
function useAdminState() {
  const { session } = useAuth();
  if (!session) throw new Error('Admin session required');
  const { connection } = useConnection();
  const client = useMemo(() => new AdminChainClient(connection), [connection]);
  const setup = useQuery({
    queryKey: ['admin', 'protocol', session.admin.wallet],
    queryFn: () => client.state(session.admin.wallet),
    staleTime: 30_000,
  });
  const transaction = useAdminTransaction(client);
  const canSign = !!session.connected.sendTransaction;
  return {
    client,
    setup,
    transaction,
    wallet: session.admin.wallet,
    disabled:
      !setup.data || setup.isPending || transaction.isPending || !canSign,
    canSign,
  };
}
import { AdminContext } from './admin-context';
export type AdminValue = ReturnType<typeof useAdminState>;
export function AdminProvider({ children }: { children: ReactNode }) {
  const value = useAdminState();
  return <AdminContext value={value}>{children}</AdminContext>;
}
