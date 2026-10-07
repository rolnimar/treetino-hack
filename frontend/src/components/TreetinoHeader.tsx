import { useState, useEffect } from 'react';
import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LogoType } from './LogoType';
import { SearchIcon, CloseIcon } from '../features/victron/victron-icons';

const walletLabels = {
  'no-wallet': 'Connect Wallet',
  'has-wallet': 'Connect Wallet',
  connecting: 'Connecting…',
  'change-wallet': 'Change Wallet',
  'copy-address': 'Copy Address',
  copied: 'Copied!',
  disconnect: 'Disconnect',
};

interface TreetinoHeaderProps {
  currentView: 'explore' | 'portfolio' | 'client' | 'admin' | 'pitch';
  selectedSiteId: number | null;
  backedCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onNavigate: (
    view: 'explore' | 'portfolio' | 'client' | 'admin' | 'pitch',
  ) => void;
  walletBalance?: string;
  onOpenDeposit?: () => void;
}

export function TreetinoHeader({
  currentView,
  selectedSiteId,
  backedCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onNavigate,
  walletBalance,
  onOpenDeposit,
}: TreetinoHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark =
    currentView === 'explore' && selectedSiteId === null && !isScrolled;

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (currentView !== 'explore' || selectedSiteId !== null) {
      onNavigate('explore');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 z-50 w-full pointer-events-none">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4 pointer-events-auto">
        <div
          className={`flex w-full items-center justify-between rounded-2xl border transition-all duration-300 px-4 py-2.5 sm:px-6 sm:py-3 ${
            isDark
              ? 'border-white/10 bg-zinc-950/60 text-white shadow-xl backdrop-blur-xl'
              : 'border-black/10 bg-white/90 text-zinc-900 shadow-md backdrop-blur-xl'
          }`}
        >
          {/* 1. Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (currentView === 'explore' && selectedSiteId === null) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  onNavigate('explore');
                }
              }}
              className="cursor-pointer transition-opacity hover:opacity-85 flex items-center"
              aria-label="Treetino Home"
            >
              <LogoType
                className={`h-6 sm:h-7 transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-zinc-950'
                }`}
              />
            </button>
          </div>

          {/* 2. Minimal Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => scrollTo('campaigns')}
              className={`rounded-xl px-3.5 py-1.5 transition cursor-pointer ${
                currentView === 'explore' && selectedSiteId === null
                  ? isDark
                    ? 'text-white font-semibold bg-white/10'
                    : 'text-zinc-950 font-semibold bg-black/5'
                  : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/5'
              }`}
            >
              Campaigns
            </button>

            <button
              type="button"
              onClick={() => scrollTo('bond-explainer')}
              className={`rounded-xl px-3.5 py-1.5 transition cursor-pointer ${
                isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/5'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/5'
              }`}
            >
              How Bond Yields Work
            </button>

            <button
              type="button"
              onClick={() => onNavigate('portfolio')}
              className={`rounded-xl px-3.5 py-1.5 transition cursor-pointer inline-flex items-center gap-1.5 ${
                currentView === 'portfolio' && selectedSiteId === null
                  ? 'bg-[#183d89] text-white font-semibold shadow-xs'
                  : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/5'
              }`}
            >
              <span>Portfolio</span>
              {backedCount > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] text-white font-mono font-bold">
                  {backedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('pitch')}
              className={`rounded-xl px-3.5 py-1.5 transition cursor-pointer inline-flex items-center gap-1.5 ${
                currentView === 'pitch'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : isDark
                    ? 'text-blue-400 hover:text-white hover:bg-white/5'
                    : 'text-blue-700 hover:text-blue-900 hover:bg-blue-50'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>Pitch Deck</span>
            </button>
          </nav>

          {/* 3. Search & Wallet */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden lg:block w-36 xl:w-44">
              <SearchIcon
                className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${
                  isDark ? 'text-white/40' : 'text-zinc-400'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className={`w-full rounded-full py-1.5 pl-8 pr-6 text-xs transition focus:outline-hidden ${
                  isDark
                    ? 'border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white/30 focus:bg-white/10'
                    : 'border border-black/10 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-[#183d89] focus:bg-white'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${
                    isDark
                      ? 'text-white/50 hover:text-white'
                      : 'text-zinc-400 hover:text-zinc-700'
                  }`}
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Balance & Faucet Pill */}
            {onOpenDeposit && (
              <button
                type="button"
                onClick={onOpenDeposit}
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition cursor-pointer shadow-2xs ${
                  walletBalance
                    ? isDark
                      ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                      : 'border-black/10 bg-zinc-50 text-zinc-900 hover:bg-zinc-100'
                    : isDark
                      ? 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'
                      : 'border-black/10 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {walletBalance ? (
                  <>
                    <span className="font-semibold">${walletBalance}</span>
                    <span className="text-[10px] text-zinc-400">USDC</span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#183d89] text-white text-[11px] font-bold">
                      +
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>+ Deposit USD</span>
                  </>
                )}
              </button>
            )}

            {/* Wallet Button */}
            <div className="shrink-0 scale-90 sm:scale-95 origin-right">
              <BaseWalletMultiButton labels={walletLabels} />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden flex h-8 w-8 items-center justify-center rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'border-white/15 text-white hover:bg-white/10'
                  : 'border-black/10 text-zinc-700 hover:bg-black/5'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="h-4 w-4" />
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div
            className={`mt-2 rounded-2xl border p-4 md:hidden space-y-3 transition-all ${
              isDark
                ? 'border-white/15 bg-zinc-950/95 text-white shadow-2xl backdrop-blur-2xl'
                : 'border-black/10 bg-white/95 text-zinc-900 shadow-xl backdrop-blur-2xl'
            }`}
          >
            {/* Mobile Deposit Button */}
            {onOpenDeposit && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDeposit();
                }}
                className="flex w-full items-center justify-between rounded-xl bg-[#183d89] px-4 py-2.5 text-xs font-semibold text-white shadow-sm cursor-pointer"
              >
                <span>
                  {walletBalance
                    ? `Balance: $${walletBalance} mockUSDC`
                    : 'Add Capital (mockUSDC Faucet)'}
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px]">
                  + Mint Funds
                </span>
              </button>
            )}

            {/* Mobile Search */}
            <div className="relative w-full">
              <SearchIcon
                className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? 'text-white/40' : 'text-zinc-400'}`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search campaigns..."
                className={`w-full rounded-xl py-2 pl-8 pr-6 text-xs transition focus:outline-hidden ${
                  isDark
                    ? 'border border-white/15 bg-white/10 text-white placeholder:text-white/40'
                    : 'border border-black/10 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => scrollTo('campaigns')}
                className={`rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                  isDark
                    ? 'text-white hover:bg-white/10'
                    : 'text-zinc-800 hover:bg-black/5'
                }`}
              >
                Campaigns
              </button>
              <button
                type="button"
                onClick={() => scrollTo('bond-explainer')}
                className={`rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                  isDark
                    ? 'text-white hover:bg-white/10'
                    : 'text-zinc-800 hover:bg-black/5'
                }`}
              >
                How Bond Yields Work
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('portfolio');
                  setMobileMenuOpen(false);
                }}
                className={`rounded-xl px-3 py-2 text-left transition flex items-center justify-between cursor-pointer ${
                  isDark
                    ? 'text-white hover:bg-white/10'
                    : 'text-zinc-800 hover:bg-black/5'
                }`}
              >
                <span>Portfolio</span>
                {backedCount > 0 && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs text-white font-mono font-bold">
                    {backedCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('pitch');
                  setMobileMenuOpen(false);
                }}
                className={`rounded-xl px-3 py-2 text-left transition flex items-center justify-between cursor-pointer ${
                  isDark
                    ? 'text-blue-400 hover:bg-white/10'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span>Pitch Deck</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400">
                  3-Min Pitch
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
