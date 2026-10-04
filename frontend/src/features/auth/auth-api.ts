import bs58 from 'bs58';
import { api, jsonBody } from '../../lib/api';
import { challengeSchema, sessionSchema } from '../../lib/schemas';
import type { ConnectedWallet } from '../../chain/wallet';
export async function signIn(connected: ConnectedWallet, signal: AbortSignal) {
  signal.throwIfAborted();
  if (!connected.signMessage)
    throw new Error('This wallet does not support message signing');
  const challenge = await api('auth/challenge', challengeSchema, {
    ...jsonBody({ wallet: connected.address }),
    signal,
  });
  const signature = await connected.signMessage(
    new TextEncoder().encode(challenge.message),
  );
  signal.throwIfAborted();
  if (!signature.length)
    throw new Error('The wallet did not return a message signature');
  const session = await api('auth/login', sessionSchema, {
    ...jsonBody({
      challengeId: challenge.id,
      wallet: connected.address,
      signature: bs58.encode(signature),
    }),
    signal,
  });
  signal.throwIfAborted();
  if (session.admin.wallet !== connected.address)
    throw new Error('Wallet account changed during login');
  return { ...session, connected };
}
