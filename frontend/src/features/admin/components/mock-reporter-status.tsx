import type { IndexedTree } from '../../../lib/schemas';
import { Button } from '../../../components/ui/button';
import { ErrorMessage } from '../../../components/ui/feedback';
import { useMockReporter } from '../hooks/use-mock-reporter';
import { useAdmin } from '../admin-context';
import { SimulateReport } from './simulate-report';

export function MockReporterStatus({ tree }: { tree: IndexedTree }) {
  const query = useMockReporter(tree.address);
  const { wallet, disabled, transaction } = useAdmin();
  const reporter = query.data;
  return (
    <div className="my-4 space-y-2 text-sm">
      <ErrorMessage error={query.error} />
      {query.isSuccess && reporter === null && (
        <p className="text-xs text-zinc-500">
          No backend mock reporter is configured for this tree. Daily reports
          must be signed by its reporter wallet.
        </p>
      )}
      {query.isSuccess && (
        <SimulateReport tree={tree} backendReporter={!!reporter} />
      )}
      {reporter && (
        <>
          <p>
            Backend mock reporter ·{' '}
            {reporter.balanceLamports === null
              ? 'Balance will update when reporting starts'
              : `${Number(reporter.balanceLamports) / 1e9} devnet SOL`}
          </p>
          <p className="text-xs text-zinc-500">
            Submits completed UTC days automatically after activation.
          </p>
          {reporter.lastError && (
            <p role="alert" className="text-red-700">
              {reporter.lastError}
            </p>
          )}
          {reporter.lastSignature && (
            <a
              className="block text-xs underline"
              href={`https://solscan.io/tx/${reporter.lastSignature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
            >
              Last mock report transaction ↗
            </a>
          )}
          <Button
            variant="secondary"
            disabled={disabled || tree.creator !== wallet}
            onClick={() =>
              transaction.mutate({
                action: 'fundReporter',
                tree,
                amount: '50000000',
              })
            }
          >
            Fund reporter · 0.05 devnet SOL
          </Button>
        </>
      )}
    </div>
  );
}
