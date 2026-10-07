import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { ConnectedWallet } from '../../chain/wallet';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/feedback';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useClientSession } from './use-client-session';
import { ClientWorkspace } from './client-workspace';

export function ClientAccess() {
  const wallet = useConnectedWallet();
  return (
    <ClientAccessForWallet
      key={wallet?.address ?? 'disconnected'}
      wallet={wallet}
    />
  );
}
function ClientAccessForWallet({ wallet }: { wallet: ConnectedWallet | null }) {
  const { setVisible } = useWalletModal();
  const { session, login, logout, error } = useClientSession(wallet);
  return (
    <section
      aria-label="Client access"
      className="border-t border-black/10 py-12"
    >
      <p className="eyebrow text-t-blue">CLIENT ACCESS</p>
      <h2 className="mb-3 text-2xl font-black text-zinc-950">
        {session ? 'Client workspace' : 'Your trees & invoices'}
      </h2>
      <ErrorMessage error={error} />
      {session && wallet ? (
        <>
          <p className="mb-4 text-sm text-zinc-600 break-all">
            Signed in as {session.client.wallet}
          </p>
          <Button variant="secondary" className="mb-5" onClick={logout}>
            Sign out as client
          </Button>
          <ClientWorkspace session={session} wallet={wallet} />
        </>
      ) : (
        <>
          <p className="mb-5 text-sm text-zinc-600">
            Sign a message with your client wallet to see its trees and
            invoices.
          </p>
          <Button
            disabled={login.isPending}
            onClick={() => (wallet ? login.mutate() : setVisible(true))}
          >
            {!wallet
              ? 'Connect client wallet'
              : login.isPending
                ? 'Confirm message in wallet…'
                : 'Sign in as client'}
          </Button>
        </>
      )}
    </section>
  );
}
