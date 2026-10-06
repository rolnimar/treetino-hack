import { lazy, Suspense, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import { protocolSchema } from './lib/schemas';
import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AdminAccess } from './AdminAccess';
import { VictronAssetPage } from './features/victron/victron-asset-page';
import { useEnrichedCampaigns } from './features/victron/use-enriched-campaigns';
import { useConnectedWallet } from './features/wallet/use-connected-wallet';
import { useMockUsdc } from './features/marketplace/hooks/use-mock-usdc';
import { formatTokenAmount } from './chain/amounts';
import { InvestorPortfolio } from './features/investor/investor-portfolio';
import { useVictronInvestments } from './features/victron/use-victron-investments';
import { SearchIcon, CloseIcon } from './features/victron/victron-icons';

const Marketplace = lazy(() =>
  import('./features/marketplace/marketplace').then((module) => ({
    default: module.Marketplace,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.hash.match(/^#(?:asset|project)\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  });

  const [currentView, setCurrentView] = useState<
    'explore' | 'portfolio' | 'admin'
  >(() => {
    if (typeof window === 'undefined') return 'explore';
    if (window.location.hash === '#portfolio') return 'portfolio';
    if (window.location.hash === '#admin') return 'admin';
    return 'explore';
  });

  const wallet = useConnectedWallet();
  const balance = useMockUsdc(wallet?.address);
  const formattedBalance = balance.data
    ? formatTokenAmount(balance.data.balance)
    : undefined;

  const { investments } = useVictronInvestments(wallet?.address);
  const backedCount = Object.values(investments).filter(
    (i) => i.amountUsdc > 0,
  ).length;

  const { data: protocol, isError: unavailable } = useQuery({
    queryKey: ['protocol'],
    queryFn: ({ signal }) => api('protocol', protocolSchema, { signal }),
  });

  const { demos } = useEnrichedCampaigns();

  // Hash-based clean page routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#(?:asset|project)\/(\d+)$/);
      if (match) {
        setSelectedSiteId(parseInt(match[1], 10));
      } else {
        setSelectedSiteId(null);
        if (hash === '#portfolio') setCurrentView('portfolio');
        else if (hash === '#admin') setCurrentView('admin');
        else setCurrentView('explore');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const selectedDemo = demos.find((d) => d.siteId === selectedSiteId);

  return (
    <main>
      <header className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-forest/15">
        <div className="flex flex-wrap items-center gap-6">
          <a
            className="brand text-3xl font-extrabold tracking-tight text-[#05ce78] hover:opacity-90 transition-opacity"
            href="#explore"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = '';
              setSelectedSiteId(null);
              setCurrentView('explore');
            }}
          >
            treetino
            <span aria-hidden="true" className="text-leaf">
              ↗
            </span>
          </a>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1.5 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                setSelectedSiteId(null);
                setCurrentView('explore');
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                currentView === 'explore' && selectedSiteId === null
                  ? 'bg-forest text-white'
                  : 'text-forest/70 hover:bg-forest/10'
              }`}
            >
              Explore
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.hash = 'portfolio';
                setSelectedSiteId(null);
                setCurrentView('portfolio');
              }}
              className={`rounded-lg px-3 py-1.5 transition flex items-center gap-1.5 ${
                currentView === 'portfolio' && selectedSiteId === null
                  ? 'bg-forest text-white'
                  : 'text-forest/70 hover:bg-forest/10'
              }`}
            >
              <span>My Backed Assets</span>
              {backedCount > 0 && (
                <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[10px] text-white">
                  {backedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.hash = 'admin';
                setSelectedSiteId(null);
                setCurrentView('admin');
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                currentView === 'admin' && selectedSiteId === null
                  ? 'bg-forest text-white'
                  : 'text-forest/70 hover:bg-forest/10'
              }`}
            >
              Protocol Admin
            </button>
          </nav>
        </div>

        {/* Central / Right Search Input */}
        <div className="flex flex-1 max-w-md items-center mx-2">
          <div className="relative w-full">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-forest/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== 'explore' || selectedSiteId !== null) {
                  window.location.hash = '';
                  setSelectedSiteId(null);
                  setCurrentView('explore');
                }
              }}
              placeholder="Search clean energy projects, battery storage, locations…"
              className="w-full rounded-full border border-forest/20 bg-white/90 py-2 pl-10 pr-9 text-xs text-forest placeholder:text-forest/40 focus:border-forest focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-forest transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="header-controls flex items-center gap-3">
          <span className="network font-mono text-xs flex items-center gap-1.5 text-forest/80">
            <span className="dot h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
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
      ) : currentView === 'portfolio' ? (
        /* INVESTOR PORTFOLIO DASHBOARD */
        <InvestorPortfolio
          onSelectAsset={(id) => {
            window.location.hash = `asset/${id}`;
            setSelectedSiteId(id);
          }}
          onExplore={() => {
            window.location.hash = '';
            setCurrentView('explore');
          }}
        />
      ) : currentView === 'admin' ? (
        /* ADMIN WORKSPACE */
        <div className="py-8">
          <AdminAccess />
        </div>
      ) : (
        /* HOME / KICKSTARTER MARKETPLACE PAGE */
        <Suspense
          fallback={
            <div className="py-24 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
              <p className="mt-4 font-mono text-xs text-forest/70">
                Loading campaigns…
              </p>
            </div>
          }
        >
          <Marketplace
            onSelectAsset={(id) => {
              window.location.hash = `asset/${id}`;
              setSelectedSiteId(id);
            }}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        </Suspense>
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
