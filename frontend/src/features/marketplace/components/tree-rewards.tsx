import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { IndexedTree } from '../../../lib/schemas';
import { formatTokenAmount } from '../../../chain/amounts';
import { Button } from '../../../components/ui/button';
import { ErrorMessage } from '../../../components/ui/feedback';
import { useTreeRewards } from '../hooks/use-tree-rewards';

export function TreeRewards({
  tree,
  wallet,
  disabled,
  onClaim,
}: {
  tree: IndexedTree;
  wallet: string | undefined;
  disabled: boolean;
  onClaim: () => void;
}) {
  const rewards = useTreeRewards(tree, wallet);
  const { setVisible } = useWalletModal();
  const state = rewards.data;
  return (
    <section
      aria-label="Investor rewards"
      className="mt-5 rounded-lg border border-forest/15 bg-leaf/10 p-4"
    >
      <h3 className="font-semibold">Your investor rewards</h3>
      {!wallet ? (
        <Button className="mt-3" onClick={() => setVisible(true)}>
          Connect wallet to view rewards
        </Button>
      ) : (
        <>
          <p
            role="status"
            aria-label="Claimable yield"
            className="my-2 text-xl font-bold"
          >
            {rewards.isError
              ? 'Rewards unavailable'
              : state
                ? `${formatTokenAmount(state.claimable)} mockUSDC`
                : 'Loading rewards…'}
          </p>
          <ErrorMessage error={rewards.error} />
          {state && !rewards.isError && (
            <p className="mb-3 text-sm text-forest/75">
              {!state.hasPosition
                ? 'This wallet has no investment in this tree.'
                : !state.active
                  ? 'Rewards can be claimed once the tree is active.'
                  : state.claimable === '0'
                    ? 'No paid invoice rewards are available to claim yet.'
                    : !state.canClaim
                      ? 'The tree revenue vault cannot cover this claim yet.'
                      : 'Your share of paid invoices, ready to claim.'}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                disabled ||
                rewards.isError ||
                !state?.canClaim ||
                rewards.isFetching
              }
              onClick={onClaim}
            >
              Claim Yield
            </Button>
            <Button
              variant="secondary"
              disabled={rewards.isFetching || disabled}
              onClick={() => void rewards.refetch()}
            >
              Refresh rewards
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
