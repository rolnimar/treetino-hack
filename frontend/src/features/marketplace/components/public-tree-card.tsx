import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { IndexedTree } from '../../../lib/schemas';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { AddressLink } from '../../../components/ui/feedback';
import { formatTokenAmount } from '../../../chain/amounts';
import { FundingBar } from './funding-bar';
import { BuySharesForm } from './buy-shares-form';

export function PublicTreeCard({
  tree,
  connected,
  balance,
  disabled,
  onBuy,
}: {
  tree: IndexedTree;
  connected: boolean;
  balance: string;
  disabled: boolean;
  onBuy: (amount: string) => void;
}) {
  const { setVisible } = useWalletModal();
  return (
    <Card title={`Tree #${tree.treeId}`}>
      <span className="mb-3 inline-block rounded-full bg-leaf/15 px-3 py-1 text-xs font-medium capitalize">
        {tree.phase}
      </span>
      <AddressLink address={tree.address} />
      <FundingBar raised={tree.raised} target={tree.target} />
      {tree.phase === 'funding' && tree.canBuy ? (
        <>
          <p className="mb-4 text-sm text-forest/70">
            {formatTokenAmount(tree.remaining)} mockUSDC remaining to fund this
            tree.
          </p>
          {connected ? (
            <BuySharesForm
              balance={balance}
              remaining={tree.remaining}
              disabled={disabled}
              onBuy={onBuy}
            />
          ) : (
            <Button onClick={() => setVisible(true)}>
              Connect wallet to buy shares
            </Button>
          )}
        </>
      ) : (
        <p className="text-sm text-forest/70">
          {tree.phase === 'active'
            ? 'Active tree. Its initial funding is complete.'
            : tree.phase === 'purchased'
              ? 'Purchased. Awaiting activation.'
              : 'Fully funded. Awaiting purchase.'}
        </p>
      )}
    </Card>
  );
}
