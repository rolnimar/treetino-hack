import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { ConnectedWallet } from '../../chain/wallet';

export function useConnectedWallet() {
  const {
    connected,
    publicKey,
    signMessage,
    signTransaction,
    sendTransaction,
  } = useWallet();
  return useMemo<ConnectedWallet | null>(
    () =>
      connected && publicKey
        ? {
            address: publicKey.toBase58(),
            signMessage,
            signTransaction,
            sendTransaction,
          }
        : null,
    [connected, publicKey, signMessage, signTransaction, sendTransaction],
  );
}
