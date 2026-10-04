import { describe, expect, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { Keypair } from '@solana/web3.js';
import { treesResponseSchema, sessionSchema } from '../src/lib/schemas';
import {
  createTreeFormSchema,
  adminsFormSchema,
  invoiceFormSchema,
} from '../src/features/admin/schemas';
const wallet = Keypair.generate().publicKey.toBase58();
describe('frontend Zod boundaries', () => {
  test('tree creation converts six-decimal amounts without losing u64 precision', () => {
    const input = {
      treeId: '18446744073709551615',
      target: '18446744073709.551615',
      supplier: wallet,
      client: wallet,
      reporter: wallet,
    };
    expect(createTreeFormSchema.parse(input)).toMatchObject({
      target: '18446744073709551615',
    });
    for (const target of ['1e3', '-1', '0.0000001', '18446744073709.551616'])
      expect(createTreeFormSchema.safeParse({ ...input, target }).success).toBe(
        false,
      );
    expect(
      createTreeFormSchema.safeParse({ ...input, supplier: 'bad wallet' })
        .success,
    ).toBe(false);
    expect(
      createTreeFormSchema.safeParse({ ...input, treeId: 'abc' }).success,
    ).toBe(false);
  });
  test('admin membership and zero-invoice validation', () => {
    expect(adminsFormSchema.parse({ wallets: wallet + '\n' })).toEqual({
      wallets: [wallet],
    });
    expect(
      adminsFormSchema.safeParse({ wallets: wallet + '\n' + wallet }).success,
    ).toBe(false);
    expect(adminsFormSchema.safeParse({ wallets: '' }).success).toBe(false);
    expect(
      invoiceFormSchema.parse({ report: wallet, amount: '0' }).amount,
    ).toBe('0');
  });
  test('backend tree and auth responses are validated before entering UI state', () => {
    expect(treesResponseSchema.parse({ trees: [], total: 0 })).toEqual({
      trees: [],
      total: 0,
    });
    expect(
      treesResponseSchema.safeParse({ trees: [{ treeId: 1 }], total: 1 })
        .success,
    ).toBe(false);
    expect(
      treesResponseSchema.safeParse({ trees: [], total: '0' }).success,
    ).toBe(false);
    const session = {
      accessToken: 'test-token',
      expiresAt: '2026-10-05T00:00:00Z',
      admin: { id: randomUUID(), wallet },
    };
    expect(sessionSchema.parse(session)).toEqual(session);
    expect(
      sessionSchema.safeParse({ ...session, expiresAt: 'bad-date' }).success,
    ).toBe(false);
  });
});
