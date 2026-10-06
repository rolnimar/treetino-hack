import { lazy, Suspense, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import { protocolSchema } from './lib/schemas';
import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AdminAccess } from './AdminAccess';
import { VictronAssetPage } from './features/victron/victron-asset-page';
import { victronDemosResponseSchema } from './features/victron/victron-types';
import { useConnectedWallet } from './features/wallet/use-connected-wallet';
import { useMockUsdc } from './features/marketplace/hooks/use-mock-usdc';
import { formatTokenAmount } from './chain/amounts';

const Marketplace = lazy(() =>
  import('./features/marketplace/marketplace').then((module) => ({
    default: module.Marketplace,
  })),
);
const ClientAccess = lazy(() =>
  import('./features/client/client-access').then((module) => ({
    default: module.ClientAccess,
  })),
);

const walletLabels = {
  'no-wallet': 'Connect wallet',
  'has-wallet': 'Connect wallet',
  connecting: 'Connecting…',
  'change-wallet': 'Change wallet',
  'copy-address': 'Copy address',
  copied: 'Copied',
  disconnect: 'Disconnect',
};

export function App() {
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.hash.match(/^#asset\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  });

  const wallet = useConnectedWallet();
  const balance = useMockUsdc(wallet?.address);
  const formattedBalance = balance.data
    ? formatTokenAmount(balance.data.balance)
    : undefined;

  const { data: protocol, isError: unavailable } = useQuery({
    queryKey: ['protocol'],
    queryFn: ({ signal }) => api('protocol', protocolSchema, { signal }),
  });

  const demosQuery = useQuery({
    queryKey: ['victron-energy-assets-v3'],
    queryFn: ({ signal }) =>
      api('victron/demos', victronDemosResponseSchema, { signal }),
    refetchInterval: 15_000,
  });

  // Hash-based fresh page routing
  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/^#asset\/(\d+)$/);
      setSelectedSiteId(match ? parseInt(match[1], 10) : null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const selectedDemo = demosQuery.data?.demos.find(
    (d) => d.siteId === selectedSiteId,
  );

  return (
    <main>
      <header>
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            if (window.location.hash) {
              e.preventDefault();
              window.location.hash = '';
              setSelectedSiteId(null);
            }
          }}
        >
          treetino<span aria-hidden="true">↗</span>
        </a>
        <div className="header-controls">
          <span className="network">
            <span className="dot" />
            Solana devnet
          </span>
          <BaseWalletMultiButton labels={walletLabels} />
        </div>
      </header>

      {/* DEDICATED FRESH PAGE VIEW IF AN ASSET IS SELECTED */}
      {selectedSiteId !== null ? (
        selectedDemo ? (
          <VictronAssetPage
            demo={selectedDemo}
            onBack={() => {
              window.location.hash = '';
              setSelectedSiteId(null);
            }}
            walletAddress={wallet?.address}
            walletBalance={formattedBalance}
          />
        ) : (
          <div className="py-24 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            <p className="mt-4 font-mono text-xs text-forest/70">
              Loading clean energy asset #{selectedSiteId}…
            </p>
          </div>
        )
      ) : (
        /* HOME / MARKETPLACE PAGE */
        <>
          <section className="hero">
            <p className="eyebrow">SHARED OWNERSHIP · CLEAN ENERGY</p>
            <h1>
              A little share.
              <br />A lasting <em>impact.</em>
            </h1>
            <p className="intro">
              Fund an energy tree together. Share in the revenue from the energy
              it produces.
            </p>
            <a className="button" href="#how-it-works">
              How it works <span aria-hidden="true">↓</span>
            </a>
            <div className="tree" aria-hidden="true">
              <div className="canopy c1" />
              <div className="canopy c2" />
              <div className="canopy c3" />
              <div className="trunk" />
              <div className="ground" />
            </div>
          </section>
          <section
            className="steps"
            id="how-it-works"
            aria-label="How Treetino works"
          >
            <article>
              <span>01 / FUND</span>
              <h2>Own a part of a tree.</h2>
              <p>
                Contribute USDC toward a tree and receive shares in its energy
                revenue.
              </p>
            </article>
            <article>
              <span>02 / GENERATE</span>
              <h2>Energy with a purpose.</h2>
              <p>
                An installed tree supplies energy to a client and reports its
                production.
              </p>
            </article>
            <article>
              <span>03 / SHARE</span>
              <h2>Revenue comes back.</h2>
              <p>
                When the client pays for that energy, shareholders can claim
                their portion.
              </p>
            </article>
          </section>
          <Suspense fallback={<p className="py-12">Loading trees…</p>}>
            <Marketplace
              onSelectAsset={(id) => {
                window.location.hash = `asset/${id}`;
                setSelectedSiteId(id);
              }}
            />
          </Suspense>
          <Suspense fallback={<p>Loading client access…</p>}>
            <ClientAccess />
          </Suspense>
          <AdminAccess />
        </>
      )}

      <footer>
        <p>Treetino · Devnet demo</p>
        <p role="status">
          {protocol
            ? 'Backend connected'
            : unavailable
              ? 'Backend unavailable'
              : 'Connecting to backend…'}
        </p>
      </footer>
    </main>
  );
}
