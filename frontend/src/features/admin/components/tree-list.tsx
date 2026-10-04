import { useState } from 'react';
import { useTrees, TREE_PAGE_SIZE } from '../../trees/use-trees';
import type { IndexedTree } from '../../../lib/schemas';
import { Button } from '../../../components/ui/button';
import { SelectField } from '../../../components/ui/field';
import { ErrorMessage } from '../../../components/ui/feedback';
import { TreeCard } from './tree-card';
import { phaseSchema } from '../../../lib/schemas';
export function TreeList() {
  const [phase, setPhase] = useState<IndexedTree['phase'] | 'all'>('all');
  const [page, setPage] = useState(0);
  const query = useTrees(phase, page);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SelectField
          label="Phase"
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
          <option value="all">All phases</option>
          {phaseSchema.options.map((phase) => (
            <option value={phase} key={phase}>
              {phase}
            </option>
          ))}
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
      {query.isPending && <p>Loading trees from backend…</p>}
      {query.data && (
        <>
          <p className="text-sm text-forest/70">
            {query.data.total} trees · Page {page + 1}
          </p>
          {query.data.trees.length ? (
            query.data.trees.map((tree) => (
              <TreeCard key={tree.id} tree={tree} />
            ))
          ) : (
            <p>No trees match this view.</p>
          )}
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
                query.isPlaceholderData ||
                (page + 1) * TREE_PAGE_SIZE >= query.data.total ||
                query.isFetching
              }
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
      <p className="text-xs text-forest/70">
        Trees come from the backend’s finalized indexer and refresh every 10
        seconds.
      </p>
    </div>
  );
}
