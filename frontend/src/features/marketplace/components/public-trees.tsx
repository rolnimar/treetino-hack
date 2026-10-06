import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { SelectField } from '../../../components/ui/field';
import { ErrorMessage } from '../../../components/ui/feedback';
import {
  phaseSchema,
  type IndexedTree,
  type IndexedReport,
} from '../../../lib/schemas';
import { TREE_PAGE_SIZE, useTrees } from '../../trees/use-trees';
import { PublicTreeCard } from './public-tree-card';

export function PublicTrees({
  connected,
  balance,
  disabled,
  onBuy,
  wallet,
  onPay,
  onClaim,
}: {
  connected: boolean;
  balance: string;
  disabled: boolean;
  onBuy: (tree: IndexedTree, amount: string) => void;
  wallet: string | undefined;
  onPay: (tree: IndexedTree, report: IndexedReport, amount: string) => void;
  onClaim: (tree: IndexedTree) => void;
}) {
  const [phase, setPhase] = useState<IndexedTree['phase'] | 'all'>('all');
  const [page, setPage] = useState(0);
  const query = useTrees(phase, page);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SelectField
          label="Browse trees"
          value={phase}
          onChange={(event) => {
            setPhase(
              event.target.value === 'all'
                ? 'all'
                : phaseSchema.parse(event.target.value),
            );
            setPage(0);
          }}
        >
          <option value="all">All trees</option>
          <option value="funding">Open for funding</option>
          <option value="active">Active trees</option>
          <option value="funded">Fully funded</option>
          <option value="purchased">Purchased</option>
        </SelectField>
        <Button
          variant="secondary"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Refresh trees
        </Button>
      </div>
      <ErrorMessage error={query.error} />
      {query.isPending && <p>Loading trees…</p>}
      {query.data && (
        <>
          <p className="text-sm text-forest/70">
            {query.data.total} trees · Page {page + 1}
          </p>
          <div className="grid gap-5 lg:grid-cols-2">
            {query.data.trees.map((tree) => (
              <PublicTreeCard
                key={tree.id}
                tree={tree}
                connected={connected}
                balance={balance}
                disabled={disabled || query.isPlaceholderData}
                onBuy={(amount) => onBuy(tree, amount)}
                wallet={wallet}
                onPay={(report, amount) => onPay(tree, report, amount)}
                onClaim={() => onClaim(tree)}
              />
            ))}
          </div>
          {!query.data.trees.length && <p>No trees in this view yet.</p>}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled={page === 0 || query.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={
                query.isFetching ||
                query.isPlaceholderData ||
                (page + 1) * TREE_PAGE_SIZE >= query.data.total
              }
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
