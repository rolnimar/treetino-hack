import bs58 from 'bs58';
import { api, jsonBody } from '../../lib/api';
import {
  challengeSchema,
  sessionSchema,
  clientSessionSchema,
} from '../../lib/schemas';
import type { ConnectedWallet } from '../../chain/wallet';
async function signedChallenge(
  connected: ConnectedWallet,
  signal: AbortSignal,
  role: 'admin' | 'client',
) {
  signal.throwIfAborted();
  if (!connected.signMessage)
    throw new Error('This wallet does not support message signing');
  const challenge = await api(
    role === 'admin' ? 'auth/challenge' : 'auth/client/challenge',
    challengeSchema,
    {
      ...jsonBody({ wallet: connected.address }),
      signal,
    },
  );
  const signature = await connected.signMessage(
    new TextEncoder().encode(challenge.message),
  );
  signal.throwIfAborted();
  if (!signature.length)
    throw new Error('The wallet did not return a message signature');
  return {
    challengeId: challenge.id,
    wallet: connected.address,
    signature: bs58.encode(signature),
  };
}
export async function signIn(connected: ConnectedWallet, signal: AbortSignal) {
  const input = await signedChallenge(connected, signal, 'admin');
  const session = await api('auth/login', sessionSchema, {
    ...jsonBody(input),
    signal,
  });
  signal.throwIfAborted();
  if (session.admin.wallet !== connected.address)
    throw new Error('Wallet account changed during login');
  return { ...session, connected };
}

export async function signInClient(
  connected: ConnectedWallet,
  signal: AbortSignal,
) {
  const input = await signedChallenge(connected, signal, 'client');
  const session = await api('auth/client/login', clientSessionSchema, {
    ...jsonBody(input),
    signal,
  });
  signal.throwIfAborted();
  if (session.client.wallet !== connected.address)
    throw new Error('Wallet account changed during login');
  return session;
}
