import { afterEach, describe, expect, test } from 'bun:test';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@anchor-lang/core';
import {
  buildPublicTransaction,
  readMockUsdcBalance,
} from '../src/chain/public';
import { sendWalletTransaction } from '../src/chain/send';
import {
  paymentAtaAddress,
  positionAddress,
  shareAtaAddress,
  reportAddress,
  revenueVaultAddress,
} from '../src/chain/addresses';
import {
  buySharesFormSchema,
  spendLimit,
} from '../src/features/marketplace/schemas';
import {
  fixture,
  cleanup,
  other,
  creator,
  tree,
  coder,
  signedWallet,
  backendTree,
  setTokenBalance,
} from './fixtures/chain';

afterEach(cleanup);
const fundingTree = () => ({
  ...backendTree('funding'),
  target: '100000000',
  raised: '25000000',
  remaining: '75000000',
  canBuy: true,
});

describe('public wallet actions', () => {
  test('client invoices are built on FE from backend reports with canonical payment accounts', async () => {
    const { client, accounts, methods, sent } = await fixture();
    const info = {
      ...backendTree('active'),
      client: other.publicKey.toBase58(),
    };
    const report = {
      address: reportAddress(tree, '1791072000').toBase58(),
      dayStartTs: '1791072000',
      totalWh: '10000',
      invoiceIssued: true,
      due: '1756496',
      paid: '500000',
    };
    setTokenBalance(accounts, other.publicKey, 2_000_000n);
    const build = (amount = '1256496', treeInfo = info, record = report) =>
      buildPublicTransaction(client.connection, other.publicKey.toBase58(), {
        action: 'payInvoice',
        tree: treeInfo,
        report: record,
        amount,
      });
    const tx = await build();
    const ix = tx.instructions[0]!;
    const decoded = coder.instruction.decode(ix.data)!;
    expect(decoded.name).toBe('pay_invoice');
    expect((decoded.data as { amount: BN }).amount.toString()).toBe('1256496');
    expect(ix.keys[0]!.isSigner).toBe(true);
    expect(ix.keys[0]!.pubkey.equals(other.publicKey)).toBe(true);
    expect(ix.keys[3]!.pubkey.equals(paymentAtaAddress(other.publicKey))).toBe(
      true,
    );
    expect(ix.keys[4]!.pubkey.equals(revenueVaultAddress(tree))).toBe(true);
    await sendWalletTransaction(
      client.connection,
      signedWallet(other),
      tx,
      () => {},
    );
    expect(sent[0]!.verifySignatures()).toBe(true);
    await expect(build('1256497')).rejects.toThrow('unpaid');
    await expect(
      build('1', { ...info, client: creator.publicKey.toBase58() }),
    ).rejects.toThrow('client');
    await expect(
      build('1', info, { ...report, invoiceIssued: false }),
    ).rejects.toThrow('issued');
    await expect(
      build('1', info, { ...report, address: other.publicKey.toBase58() }),
    ).rejects.toThrow('belong');
    setTokenBalance(accounts, other.publicKey, 1n);
    await expect(build()).rejects.toThrow('Insufficient');
    expect(methods).not.toContain('getProgramAccounts');
    expect(methods).not.toContain('getAccountInfo');
  });
  test('missing token accounts show zero and the faucet works for a non-admin wallet', async () => {
    const { client, accounts, methods } = await fixture();
    const address = other.publicKey.toBase58();
    expect(await readMockUsdcBalance(client.connection, address)).toEqual({
      initialized: true,
      balance: '0',
    });
    const tx = await buildPublicTransaction(client.connection, address, {
      action: 'giveMeMoney',
      amount: '1000000',
    });
    expect(coder.instruction.decode(tx.instructions[0].data)?.name).toBe(
      'give_me_money',
    );
    expect(tx.feePayer?.equals(other.publicKey)).toBe(true);
    expect(
      tx.instructions[0].keys[2].pubkey.equals(
        paymentAtaAddress(other.publicKey),
      ),
    ).toBe(true);
    setTokenBalance(accounts, other.publicKey, 18446744073709551615n);
    expect(
      (await readMockUsdcBalance(client.connection, address)).balance,
    ).toBe('18446744073709551615');
    expect(methods).not.toContain('getAccountInfo');
    expect(methods).not.toContain('getProgramAccounts');
  });

  test('share purchases use backend trees and canonical buyer accounts, without admin membership', async () => {
    const { client, accounts, methods } = await fixture();
    setTokenBalance(accounts, other.publicKey, 10_000_000n);
    const tx = await buildPublicTransaction(
      client.connection,
      other.publicKey.toBase58(),
      { action: 'buyShares', tree: fundingTree(), amount: '10000000' },
    );
    const ix = tx.instructions[0];
    const decoded = coder.instruction.decode(ix.data)!;
    expect(decoded.name).toBe('buy_shares');
    expect((decoded.data as { amount: BN }).amount.toString()).toBe('10000000');
    expect(ix.keys[0].pubkey.equals(other.publicKey)).toBe(true);
    expect(
      ix.keys[5].pubkey.equals(shareAtaAddress(tree, other.publicKey)),
    ).toBe(true);
    expect(
      ix.keys[6].pubkey.equals(positionAddress(tree, other.publicKey)),
    ).toBe(true);
    expect(ix.keys.map((key) => key.pubkey.toBase58())).toContain(
      paymentAtaAddress(other.publicKey).toBase58(),
    );
    expect(
      methods.every((method) =>
        ['getGenesisHash', 'getMultipleAccounts'].includes(method),
      ),
    ).toBe(true);
    const rejected = (amount: string, info = fundingTree()) =>
      buildPublicTransaction(client.connection, other.publicKey.toBase58(), {
        action: 'buyShares',
        tree: info,
        amount,
      });
    await expect(rejected('10000001')).rejects.toThrow('Insufficient');
    setTokenBalance(accounts, other.publicKey, 100_000_000n);
    await expect(rejected('75000001')).rejects.toThrow('remaining');
    await expect(
      rejected('1', { ...fundingTree(), phase: 'active' }),
    ).rejects.toThrow('no longer');
    await expect(
      rejected('1', {
        ...fundingTree(),
        address: creator.publicKey.toBase58(),
      }),
    ).rejects.toThrow('seeds');
    await expect(
      rejected('1', { ...fundingTree(), remaining: '1' }),
    ).rejects.toThrow('funding data');
    const missing = await fixture({ initialized: false });
    await expect(
      buildPublicTransaction(
        missing.client.connection,
        other.publicKey.toBase58(),
        { action: 'giveMeMoney', amount: '1' },
      ),
    ).rejects.toThrow('initialized');
    const wrong = await fixture({ genesis: 'mainnet' });
    await expect(
      readMockUsdcBalance(wrong.client.connection, other.publicKey.toBase58()),
    ).rejects.toThrow('devnet');
  });

  test('faucet and purchase are signed by the buyer; balance updates on confirmed sends', async () => {
    let rawBalance = 0n;
    const { client, sent, accounts } = await fixture({
      onSend: (tx, accounts) => {
        expect(tx.verifySignatures()).toBe(true);
        const decoded = coder.instruction.decode(tx.instructions[0].data)!;
        const amount = BigInt(
          (decoded.data as { amount: BN }).amount.toString(),
        );
        rawBalance += decoded.name === 'give_me_money' ? amount : -amount;
        setTokenBalance(accounts, other.publicKey, rawBalance);
      },
    });
    const execute = async (
      value: Parameters<typeof buildPublicTransaction>[2],
    ) => {
      const tx = await buildPublicTransaction(
        client.connection,
        other.publicKey.toBase58(),
        value,
      );
      return sendWalletTransaction(
        client.connection,
        signedWallet(other),
        tx,
        () => {},
      );
    };
    await execute({ action: 'giveMeMoney', amount: '15000000' });
    expect(
      (await readMockUsdcBalance(client.connection, other.publicKey.toBase58()))
        .balance,
    ).toBe('15000000');
    await execute({
      action: 'buyShares',
      tree: fundingTree(),
      amount: '10000000',
    });
    expect(
      (await readMockUsdcBalance(client.connection, other.publicKey.toBase58()))
        .balance,
    ).toBe('5000000');
    expect(sent).toHaveLength(2);
    expect(accounts.has(paymentAtaAddress(other.publicKey).toBase58())).toBe(
      true,
    );
    // Reject an account whose token owner differs from the connected wallet.
    const wrongAccount = accounts.get(
      paymentAtaAddress(other.publicKey).toBase58(),
    )!;
    creator.publicKey.toBuffer().copy(wrongAccount.data, 32);
    await expect(
      readMockUsdcBalance(client.connection, other.publicKey.toBase58()),
    ).rejects.toThrow('Invalid');
    expect(PublicKey.isOnCurve(other.publicKey.toBytes())).toBe(true);
  });

  test('purchase form limits use exact base units and malformed amounts return validation errors', () => {
    expect(spendLimit('18446744073709551615', '75000001')).toBe('75000001');
    const schema = buySharesFormSchema('10000000', '5000000');
    expect(schema.parse({ amount: '5' })).toEqual({ amount: '5000000' });
    for (const amount of [
      '',
      'nope',
      '1e3',
      '0',
      '-1',
      '5.000001',
      '11',
      '0.0000001',
    ])
      expect(schema.safeParse({ amount }).success).toBe(false);
  });
});
