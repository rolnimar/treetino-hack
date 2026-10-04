import type { WalletContextState } from '@solana/wallet-adapter-react';
export interface ConnectedWallet {
  address: string;
  signMessage: WalletContextState['signMessage'];
  signTransaction: WalletContextState['signTransaction'];
  sendTransaction: WalletContextState['sendTransaction'];
}
