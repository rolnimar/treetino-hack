import { afterEach, expect, spyOn, test } from 'bun:test';
import { createPrivateKey, sign, verify, createPublicKey } from 'node:crypto';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { signInClient } from '../src/features/auth/auth-api';

let stub: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;
afterEach(() => stub?.mockRestore());
const keypair = Keypair.generate();
const privateKey = createPrivateKey({
  key: Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    Buffer.from(keypair.secretKey.slice(0, 32)),
  ]),
  format: 'der',
  type: 'pkcs8',
});
const wallet = keypair.publicKey.toBase58();
const challenge = {
  id: '00000000-0000-4000-8000-000000000001',
  message: 'Treetino client challenge',
  expiresAt: new Date(Date.now() + 300000).toISOString(),
};
const session = {
  accessToken: 'client-token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  client: { wallet },
};

test('client sign-in signs the exact message and uses the client-only endpoints and response schema', async () => {
  stub = spyOn(globalThis, 'fetch').mockImplementation(
    async (path, options) => {
      if (path === '/api/auth/client/challenge') {
        expect(JSON.parse(String(options!.body))).toEqual({ wallet });
        return Response.json(challenge);
      }
      expect(path).toBe('/api/auth/client/login');
      const input = JSON.parse(String(options!.body));
      expect(input.challengeId).toBe(challenge.id);
      expect(input.wallet).toBe(wallet);
      expect(
        verify(
          null,
          Buffer.from(challenge.message),
          createPublicKey(privateKey),
          bs58.decode(input.signature),
        ),
      ).toBe(true);
      return Response.json(session);
    },
  );
  const connected = {
    address: wallet,
    signMessage: async (bytes: Uint8Array) =>
      new Uint8Array(sign(null, bytes, privateKey)),
  };
  expect(await signInClient(connected, new AbortController().signal)).toEqual(
    session,
  );
  expect(stub).toHaveBeenCalledTimes(2);
  stub.mockResolvedValueOnce(Response.json(challenge)).mockResolvedValueOnce(
    Response.json({
      ...session,
      client: { wallet: Keypair.generate().publicKey.toBase58() },
    }),
  );
  await expect(
    signInClient(connected, new AbortController().signal),
  ).rejects.toThrow('Wallet account changed');
});

test('cancelled client login cannot submit a signature after wallet change or logout', async () => {
  stub = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(challenge));
  const controller = new AbortController();
  await expect(
    signInClient(
      {
        address: wallet,
        signMessage: async () => {
          controller.abort();
          return new Uint8Array(64);
        },
      },
      controller.signal,
    ),
  ).rejects.toThrow();
  expect(stub).toHaveBeenCalledTimes(1);
});
