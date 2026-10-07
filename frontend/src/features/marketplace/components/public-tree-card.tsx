import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { IndexedTree, IndexedReport } from '../../../lib/schemas';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { AddressLink } from '../../../components/ui/feedback';
import { formatTokenAmount } from '../../../chain/amounts';
import { FundingBar } from './funding-bar';
import { BuySharesForm } from './buy-shares-form';
import { TreeInvoices } from './tree-invoices';
import { TreeRewards } from './tree-rewards';

export function PublicTreeCard({
  tree,
  connected,
  balance,
  disabled,
  onBuy,
  wallet,
  onPay,
  onClaim,
}: {
  tree: IndexedTree;
  connected: boolean;
  balance: string;
  disabled: boolean;
  onBuy: (amount: string) => void;
  wallet: string | undefined;
  onPay: (report: IndexedReport, amount: string) => void;
  onClaim: () => void;
}) {
  const { setVisible } = useWalletModal();

  const phaseColors: Record<string, string> = {
    funding: 'bg-t-blue/10 text-t-blue border-t-blue/20',
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    purchased: 'bg-amber-50 text-amber-800 border-amber-200',
    funded: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  };

  return (
    <Card title={`Energy Tree #${tree.treeId}`}>
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`inline-block rounded-full border px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
            phaseColors[tree.phase] ||
            'bg-zinc-100 text-zinc-700 border-zinc-200'
          }`}
        >
          {tree.phase}
        </span>
        <span className="text-xs text-zinc-400 font-mono">On-chain Pool</span>
      </div>

      <div className="mb-3">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
          Mint Account
        </span>
        <AddressLink address={tree.address} />
      </div>

      <FundingBar raised={tree.raised} target={tree.target} />

      {tree.phase === 'funding' && tree.canBuy ? (
        <div className="mt-4 rounded-xl border border-black/5 bg-zinc-50 p-4">
          <p className="mb-3 text-xs text-zinc-600">
            <strong className="text-zinc-900 font-semibold font-mono">
              {formatTokenAmount(tree.remaining)} mockUSDC
            </strong>{' '}
            remaining to fully fund this tree pool.
          </p>
          {connected ? (
            <BuySharesForm
              balance={balance}
              remaining={tree.remaining}
              disabled={disabled}
              onBuy={onBuy}
            />
          ) : (
            <Button className="w-full" onClick={() => setVisible(true)}>
              Connect wallet to buy shares
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          {tree.phase === 'active'
            ? 'Active tree. Initial crowdfunding round is complete; generating metered PPA cashflows.'
            : tree.phase === 'purchased'
              ? 'Hardware purchased and in transit. Awaiting final grid activation.'
              : 'Fully funded. Hardware procurement underway.'}
        </p>
      )}

      {tree.phase === 'active' && (
        <div className="mt-6 border-t border-black/10 pt-4">
          <TreeRewards
            tree={tree}
            wallet={wallet}
            disabled={disabled}
            onClaim={onClaim}
          />
        </div>
      )}

      {tree.phase === 'active' && (
        <div className="mt-6 border-t border-black/10 pt-4">
          <TreeInvoices
            tree={tree}
            wallet={wallet}
            balance={balance}
            disabled={disabled}
            onPay={onPay}
          />
        </div>
      )}
    </Card>
  );
}
