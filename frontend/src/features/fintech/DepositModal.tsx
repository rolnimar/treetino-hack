import { useState, useEffect } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { parseTokenAmount } from '../../chain/amounts';
import {
  CloseIcon,
  CheckIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ExternalLinkIcon,
} from '../victron/victron-icons';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: string;
  onDepositSuccess?: () => void;
}

export function DepositModal({
  isOpen,
  onClose,
  currentBalance,
  onDepositSuccess,
}: DepositModalProps) {
  const wallet = useConnectedWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const publicTx = usePublicTransactions(wallet);

  const [amountStr, setAmountStr] = useState('1000');
  const [successDismissTimer, setSuccessDismissTimer] = useState<number | null>(
    null,
  );

  const amountNum = parseFloat(amountStr) || 0;

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (successDismissTimer) window.clearTimeout(successDismissTimer);
    };
  }, [successDismissTimer]);

  if (!isOpen) return null;

  const handleDeposit = () => {
    if (!wallet) {
      openWalletModal(true);
      return;
    }
    if (amountNum <= 0) return;

    try {
      const baseUnits = parseTokenAmount(amountStr);
      publicTx.mutate(
        { action: 'giveMeMoney', amount: baseUnits },
        {
          onSuccess: () => {
            onDepositSuccess?.();
            const timer = window.setTimeout(() => {
              publicTx.reset();
              onClose();
            }, 3000);
            setSuccessDismissTimer(timer);
          },
        },
      );
    } catch (err) {
      console.error('Invalid token amount:', err);
    }
  };

  // Projected earnings calculation
  const estAnnualYield = (amountNum * 0.152).toFixed(2);
  const estMonthlyYield = ((amountNum * 0.152) / 12).toFixed(2);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-2xl transition-all space-y-6">
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition cursor-pointer"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#183d89]/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#183d89]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#183d89]" />
            1:1 STABLE ENERGY CURRENCY · DEVNET FAUCET
          </div>
          <h2
            id="deposit-modal-title"
            className="text-2xl font-medium tracking-tight text-zinc-950 sm:text-3xl"
          >
            Add Capital (mockUSDC)
          </h2>
          <p className="text-xs text-zinc-600 font-light leading-relaxed">
            Deposit test capital pegged 1:1 to USD. Back high-yield physical
            energy pools and watch automated kilowatt-hour cashflows stream
            directly into your wallet.
          </p>
        </div>

        {/* Wallet Status Card */}
        <div className="rounded-2xl border border-black/10 bg-zinc-50/80 p-4 flex items-center justify-between text-xs">
          <div>
            <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              Connected Wallet
            </span>
            <span className="font-mono font-medium text-zinc-900 mt-0.5 block">
              {wallet?.address
                ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-6)}`
                : 'No wallet connected'}
            </span>
          </div>

          <div className="text-right">
            <span className="block font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
              Current Balance
            </span>
            <span className="font-mono text-sm font-semibold text-zinc-950 mt-0.5 block">
              {currentBalance ? `${currentBalance} mockUSDC` : '$0.00 mockUSDC'}
            </span>
          </div>
        </div>

        {/* Amount Configuration */}
        <div className="space-y-3">
          <label
            htmlFor="deposit-amount-input"
            className="block font-mono text-xs font-semibold text-zinc-700 uppercase tracking-wider"
          >
            Select Deposit Amount
          </label>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
              <CurrencyDollarIcon className="h-5 w-5" />
            </div>
            <input
              id="deposit-amount-input"
              type="number"
              min="10"
              max="50000"
              step="50"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full rounded-2xl border border-black/15 bg-white py-3.5 pl-11 pr-24 font-mono text-2xl font-light text-zinc-950 focus:border-[#183d89] focus:ring-1 focus:ring-[#183d89] focus:outline-hidden shadow-2xs"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-xs font-semibold text-zinc-400">
              mockUSDC
            </span>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {['250', '500', '1000', '2500', '5000'].map((val) => {
              const active = amountStr === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(val)}
                  className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#183d89] text-white shadow-2xs'
                      : 'border border-black/10 bg-white text-zinc-700 hover:bg-black/5'
                  }`}
                >
                  +${parseInt(val, 10).toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Yield Potential Callout */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] text-emerald-800">
            <span className="font-semibold uppercase tracking-wider">
              Projected Annual Yield (~15.2% Avg APY):
            </span>
            <span className="font-bold text-sm text-emerald-900">
              +${estAnnualYield} / yr
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-light leading-snug">
            With ${amountNum.toLocaleString()} deposited, you can earn
            approximately ~${estMonthlyYield}/mo in continuous clean energy
            dividends.
          </p>
        </div>

        {/* Feedback Messages */}
        {publicTx.isPending && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#183d89]/20 bg-blue-50/70 p-4 text-xs font-medium text-zinc-900">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#183d89] border-t-transparent shrink-0" />
            <div>
              <p className="font-semibold text-[#183d89]">
                Submitting Solana Devnet Transaction…
              </p>
              <p className="text-[11px] text-zinc-600 font-light mt-0.5">
                Confirm the transaction in your connected wallet.
              </p>
            </div>
          </div>
        )}

        {publicTx.isSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 text-xs font-medium text-emerald-900">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
              <CheckIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-bold">
                +${amountNum.toLocaleString()} mockUSDC Deposited!
              </p>
              <p className="text-[11px] text-emerald-700 font-light mt-0.5">
                Funds are immediately available to back active hardware pools.
              </p>
              {publicTx.signature && (
                <a
                  href={`https://solscan.io/tx/${publicTx.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-emerald-800 underline hover:text-emerald-950"
                >
                  <span>View transaction on Solscan</span>
                  <ExternalLinkIcon className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {publicTx.error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
            {publicTx.error.message}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          {!wallet ? (
            <button
              type="button"
              onClick={() => openWalletModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#183d89] hover:bg-[#2762ad] py-4 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Connect Wallet to Deposit</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={publicTx.isPending || amountNum <= 0}
              onClick={handleDeposit}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#183d89] hover:bg-[#2762ad] py-4 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>
                {publicTx.isPending
                  ? 'Confirming on Solana…'
                  : `Mint +$${amountNum.toLocaleString()} mockUSDC →`}
              </span>
            </button>
          )}
        </div>

        {/* Guarantees Footer */}
        <div className="flex items-center justify-center gap-2 border-t border-black/5 pt-4 text-[11px] text-zinc-500 font-mono">
          <ShieldCheckIcon className="h-3.5 w-3.5 text-zinc-400" />
          <span>Non-Custodial · Instant Devnet Settlement · Zero Slippage</span>
        </div>
      </div>
    </div>
  );
}
