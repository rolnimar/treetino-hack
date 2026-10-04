import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  WalletAdapterNetwork,
  type Adapter,
} from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '../chain/buffer';
import '@solana/wallet-adapter-react-ui/styles.css';
import { AuthProvider } from '../features/auth/auth-provider';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
// Keep common wallets available even when their extensions are not installed.
// Wallet Standard discovery adds other wallets and deduplicates these by name.
const wallets: Adapter[] = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }),
];
const endpoint =
  import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider
        endpoint={endpoint}
        config={{ commitment: 'confirmed' }}
      >
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <AuthProvider>{children}</AuthProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
