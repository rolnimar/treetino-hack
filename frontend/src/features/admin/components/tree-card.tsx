import type { IndexedTree } from '../../../lib/schemas';
import { useAdmin } from '../admin-context';
import { Card } from '../../../components/ui/card';
import { AddressLink } from '../../../components/ui/feedback';
import { Button } from '../../../components/ui/button';
import { formatTokenAmount } from '../../../chain/amounts';
import { ActivationForm } from './activation-form';
import { ReportsPanel } from './reports-panel';
export function TreeCard({ tree }: { tree: IndexedTree }) {
  const { wallet, disabled, transaction } = useAdmin();
  const mine = tree.creator === wallet;
  return (
    <Card title={`Tree #${tree.treeId}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-full bg-leaf/15 px-3 py-1 text-xs font-medium">
          {tree.phase}
        </span>
        <span className="text-xs text-forest/60">
          Indexed {new Date(tree.updatedAt).toLocaleString()}
        </span>
      </div>
      <AddressLink address={tree.address} />
      <dl className="my-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-forest/60">Funding</dt>
          <dd>
            {formatTokenAmount(tree.raised)} / {formatTokenAmount(tree.target)}{' '}
            mockUSDC
          </dd>
        </div>
        <div>
          <dt className="text-forest/60">Creator</dt>
          <dd>
            <AddressLink address={tree.creator} />
          </dd>
        </div>
        <div>
          <dt className="text-forest/60">Supplier</dt>
          <dd>
            <AddressLink address={tree.supplier} />
          </dd>
        </div>
        <div>
          <dt className="text-forest/60">Client</dt>
          <dd>
            <AddressLink address={tree.client} />
          </dd>
        </div>
        <div>
          <dt className="text-forest/60">Reporter</dt>
          <dd>
            <AddressLink address={tree.reporter} />
          </dd>
        </div>
      </dl>
      {!mine && (
        <p className="mb-3 text-sm text-forest/70">
          Lifecycle actions require this tree’s creator wallet.
        </p>
      )}
      {tree.phase === 'funding' && (
        <p className="text-sm">
          Purchase becomes available when funding reaches the target.
        </p>
      )}
      {tree.phase === 'funded' && (
        <>
          <p className="mb-3 text-sm">
            Purchase sends the funding target to the supplier’s payment ATA.
          </p>
          <Button
            disabled={disabled || !mine}
            onClick={() => transaction.mutate({ action: 'purchaseTree', tree })}
          >
            Purchase tree
          </Button>
        </>
      )}
      {tree.phase === 'purchased' && <ActivationForm tree={tree} />}
      {tree.phase === 'active' && <ReportsPanel tree={tree} />}
    </Card>
  );
}
