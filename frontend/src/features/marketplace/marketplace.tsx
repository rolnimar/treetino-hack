import { useConnectedWallet } from '../wallet/use-connected-wallet';
import type { ConnectedWallet } from '../../chain/wallet';
import { formatTokenAmount } from '../../chain/amounts';
import { useMockUsdc } from './hooks/use-mock-usdc';
import { usePublicTransactions } from './hooks/use-public-transactions';
import { Button } from '../../components/ui/button';
import { ErrorMessage } from '../../components/ui/feedback';
import { PublicTrees } from './components/public-trees';
import { PublicFaucet } from './components/public-faucet';
import { VictronDemos } from '../victron/victron-demos';

export function Marketplace({
  onSelectAsset,
  searchQuery,
  onClearSearch,
}: {
  onSelectAsset?: (siteId: number) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
} = {}) {
  const wallet = useConnectedWallet();
  return (
    <PublicPortfolio
      key={wallet?.address ?? 'disconnected'}
      wallet={wallet}
      onSelectAsset={onSelectAsset}
      searchQuery={searchQuery}
      onClearSearch={onClearSearch}
    />
  );
}
function PublicPortfolio({
  wallet,
  onSelectAsset,
  searchQuery,
  onClearSearch,
}: {
  wallet: ConnectedWallet | null;
  onSelectAsset?: (siteId: number) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}) {
  const balance = useMockUsdc(wallet?.address);
  const transaction = usePublicTransactions(wallet);
  const disabled =
    !wallet ||
    !balance.data?.initialized ||
    balance.isPending ||
    transaction.isPending;
  return (
    <section id="trees" aria-label="Public tree marketplace" className="py-6">
      <VictronDemos
        onSelectAsset={onSelectAsset}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
      />

      <div className="mt-12 border-t border-forest/20 pt-10">
        <p className="eyebrow">ON-CHAIN ASSET POOLS</p>
        <h2 className="mb-3 text-2xl font-bold">Explore Trees. Own a Share.</h2>
        <p className="mb-6 text-sm text-forest/75">
          Tokenized on-chain pools ready for investor capital. Fund active
          trees, track allocations, and collect revenue distributions.
        </p>
      </div>
      {wallet && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-leaf/15 p-4">
          <div>
            <p className="text-sm">Your mockUSDC balance</p>
            <p
              className="text-xl font-bold"
              role="status"
              aria-label="mockUSDC balance"
            >
              {balance.data
                ? `${formatTokenAmount(balance.data.balance)} mockUSDC`
                : balance.isPending
                  ? 'Loading balance…'
                  : 'Balance unavailable'}
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={balance.isFetching}
            onClick={() => void balance.refetch()}
          >
            Refresh balance
          </Button>
        </div>
      )}
      <ErrorMessage error={balance.error} />
      {balance.data && !balance.data.initialized && (
        <p className="mb-4 text-sm">
          The demo payment token is awaiting protocol initialization.
        </p>
      )}
      <ErrorMessage error={transaction.error} />
      {(transaction.isPending || transaction.isSuccess) && (
        <p role="status" className="mb-4 rounded-md bg-leaf/15 p-3 text-sm">
          {transaction.isPending
            ? transaction.signature
              ? 'Submitted. Waiting for confirmation…'
              : 'Confirm the transaction in your wallet.'
            : 'Transaction confirmed. Balance refreshed; tree funding updates as indexing catches up.'}
        </p>
      )}
      {transaction.signature && (
        <a
          className="mb-4 block text-sm underline"
          href={`https://explorer.solana.com/tx/${transaction.signature}?cluster=devnet`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction ↗
        </a>
      )}
      <PublicTrees
        connected={!!wallet}
        balance={balance.data?.balance ?? '0'}
        disabled={disabled}
        onBuy={(tree, amount) =>
          transaction.mutate({ action: 'buyShares', tree, amount })
        }
      />
      <div className="mt-8">
        <PublicFaucet
          connected={!!wallet}
          disabled={disabled}
          onMint={(amount) =>
            transaction.mutate({ action: 'giveMeMoney', amount })
          }
        />
      </div>
    </section>
  );
}
