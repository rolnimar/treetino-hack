import { lazy, Suspense, useState } from 'react';
import { AdminProvider } from './admin-provider';
import { useAdmin } from './admin-context';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/feedback';
const ProtocolSetup = lazy(() =>
  import('./components/protocol-setup').then((module) => ({
    default: module.ProtocolSetup,
  })),
);
const CreateTreeForm = lazy(() =>
  import('./components/create-tree-form').then((module) => ({
    default: module.CreateTreeForm,
  })),
);
const TreeList = lazy(() =>
  import('./components/tree-list').then((module) => ({
    default: module.TreeList,
  })),
);
const FaucetForm = lazy(() =>
  import('./components/faucet-form').then((module) => ({
    default: module.FaucetForm,
  })),
);
const tabs = [
  { id: 'setup', label: 'Protocol setup' },
  { id: 'trees', label: 'Trees' },
  { id: 'create', label: 'Create tree' },
  { id: 'faucet', label: 'Demo faucet' },
] as const;
export function AdminWorkspace() {
  return (
    <AdminProvider>
      <Workspace />
    </AdminProvider>
  );
}
function Workspace() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('setup');
  const { setup, transaction, canSign } = useAdmin();
  return (
    <div className="my-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">Devnet management</h3>
          <p className="text-sm text-forest/70">
            {setup.data
              ? `${Number(setup.data.balanceLamports) / 1e9} SOL`
              : 'Reading protocol setup…'}
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={setup.isFetching || transaction.isPending}
          onClick={() => void setup.refetch()}
        >
          Refresh setup
        </Button>
      </div>
      <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
        {tabs.map(({ id, label }) => (
          <Button
            key={id}
            variant={tab === id ? 'primary' : 'secondary'}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </nav>
      {!canSign && (
        <p role="alert" className="text-sm text-red-700">
          Connect a wallet that supports devnet transaction signing.
        </p>
      )}
      <ErrorMessage error={setup.error} />
      <ErrorMessage error={transaction.error} />
      {(transaction.isPending || transaction.isSuccess) && (
        <p role="status" className="rounded-md bg-leaf/15 p-3 text-sm">
          {transaction.isPending
            ? transaction.signature
              ? 'Submitted. Waiting for chain confirmation…'
              : 'Preparing transaction. Your wallet will ask you to sign.'
            : 'Transaction confirmed. Tree listings update after the backend indexer catches up.'}
        </p>
      )}
      {transaction.signature && (
        <a
          className="text-sm underline break-all"
          target="_blank"
          rel="noreferrer"
          href={`https://solscan.io/tx/${transaction.signature}?cluster=devnet`}
        >
          View transaction ↗
        </a>
      )}
      <Suspense fallback={<p>Loading admin section…</p>}>
        {tab === 'setup' && <ProtocolSetup />}
        {tab === 'create' && <CreateTreeForm />}
        {tab === 'trees' && <TreeList />}
        {tab === 'faucet' && <FaucetForm />}
      </Suspense>
    </div>
  );
}
