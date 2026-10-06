import { afterEach, describe, expect, test } from 'bun:test';
import { BN, BorshCoder, type Idl } from '@anchor-lang/core';
import {
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  SystemInstruction,
  type AccountInfo,
} from '@solana/web3.js';
import {
  MintLayout,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { TreeInfo } from '@treetino/contracts';
import { TREETINO_IDL } from '@treetino/contracts';
import bs58 from 'bs58';
import { AdminChainClient, DEVNET_GENESIS } from '../src/chain/client';
import {
  PROGRAM_ID,
  UPGRADEABLE_LOADER_ID,
  adminConfigAddress,
  paymentMintAddress,
  treeAddress,
  shareMintAddress,
  fundingVaultAddress,
  revenueVaultAddress,
  reportAddress,
  paymentAtaAddress,
  paymentMetadataAddress,
} from '../src/chain/addresses';
import {
  parseTokenAmount,
  formatTokenAmount,
  nextUtcDay,
} from '../src/chain/amounts';
import type { ConnectedWallet } from '../src/chain/wallet';

import {
  fixture,
  cleanup,
  coder,
  creator,
  other,
  supplier,
  clientWallet,
  reporter,
  tree,
  treeId,
  programData,
  dayStartTs,
  signedWallet,
  backendTree,
} from './fixtures/chain';
afterEach(cleanup);

function decoded(transaction: Transaction) {
  return coder.instruction.decode(transaction.instructions.at(-1)!.data)!;
}

describe('frontend chain management', () => {
  test('report simulation is built and signed on the frontend by the configured reporter using canonical PDAs', async () => {
    const f = await fixture({ phase: 'Active' });
    const input = {
      action: 'simulateReport' as const,
      tree: { ...backendTree('active'), reporter: other.publicKey.toBase58() },
      dayStartTs,
      wh: [0, 4294967295, 123],
    };
    const tx = await f.client.build(other.publicKey.toBase58(), input);
    expect(decoded(tx).name).toBe('submit_report');
    const args = decoded(tx).data as { day_start_ts: BN; wh: number[] };
    expect(args.wh).toEqual(input.wh);
    expect(args.day_start_ts.toString()).toBe(dayStartTs);
    expect(
      tx.instructions[0]!.keys[2]!.pubkey.equals(
        reportAddress(tree, dayStartTs),
      ),
    ).toBe(true);
    expect(tx.instructions[0]!.keys[0]).toMatchObject({
      isSigner: true,
      isWritable: true,
    });
    await expect(
      f.client.build(creator.publicKey.toBase58(), input),
    ).rejects.toThrow('reporter');
    await expect(
      f.client.build(other.publicKey.toBase58(), {
        ...input,
        tree: { ...input.tree, address: other.publicKey.toBase58() },
      }),
    ).rejects.toThrow('seeds');
    await expect(
      f.client.build(other.publicKey.toBase58(), {
        ...input,
        tree: { ...input.tree, phase: 'purchased' },
      }),
    ).rejects.toThrow('Activate');
    await f.client.execute(signedWallet(other), input, () => {});
    expect(f.sent[0]!.verifySignatures()).toBe(true);
    expect(f.sent[0]!.feePayer!.equals(other.publicKey)).toBe(true);
    expect(decoded(f.sent[0]!).name).toBe('submit_report');
  });
  test('token amounts remain exact across decimals and u64 boundaries', () => {
    expect(parseTokenAmount('18446744073709.551615')).toBe(
      '18446744073709551615',
    );
    expect(formatTokenAmount('18446744073709551615')).toBe(
      '18446744073709.551615',
    );
    expect(parseTokenAmount('0', true)).toBe('0');
    expect(parseTokenAmount('0.000001')).toBe('1');
    for (const value of [
      '-1',
      '0',
      '1e3',
      '0.0000001',
      '18446744073709.551616',
    ])
      expect(() => parseTokenAmount(value)).toThrow();
    expect(treeAddress(other.publicKey, treeId).equals(tree)).toBe(false);
  });
  test('first initialization uses the actual upgrade authority and canonical metadata accounts', async () => {
    const { client } = await fixture({ initialized: false });
    const state = await client.state(creator.publicKey.toBase58());
    expect(state.adminsInitialized).toBe(false);
    expect(state.paymentTokenInitialized).toBe(false);
    const tx = await client.build(creator.publicKey.toBase58(), {
      action: 'initAdmins',
      wallets: [creator.publicKey.toBase58()],
    });
    expect(decoded(tx).name).toBe('init_admins');
    expect(tx.instructions[0].keys[2].pubkey.equals(programData)).toBe(true);
    expect(tx.instructions[0].keys[3].pubkey.equals(adminConfigAddress())).toBe(
      true,
    );
    await expect(
      client.build(other.publicKey.toBase58(), {
        action: 'initAdmins',
        wallets: [other.publicKey.toBase58()],
      }),
    ).rejects.toThrow('upgrade authority');
    await expect(
      client.build(creator.publicKey.toBase58(), {
        action: 'initAdmins',
        wallets: [creator.publicKey.toBase58(), creator.publicKey.toBase58()],
      }),
    ).rejects.toThrow('duplicate');
    const mint = await client.build(creator.publicKey.toBase58(), {
      action: 'initPaymentToken',
    });
    expect(decoded(mint).name).toBe('init_payment_token');
    expect(
      mint.instructions[0].keys[1].pubkey.equals(paymentMintAddress()),
    ).toBe(true);
    expect(
      mint.instructions[0].keys[2].pubkey.equals(paymentMetadataAddress()),
    ).toBe(true);
  });
  test('admin updates and tree creation preserve raw u64 values and all PDA accounts', async () => {
    const { client } = await fixture();
    const update = await client.build(creator.publicKey.toBase58(), {
      action: 'setAdmins',
      wallets: [other.publicKey.toBase58()],
    });
    expect(decoded(update).name).toBe('set_admins');
    const input = {
      action: 'initTree' as const,
      treeId,
      target: '18446744073709551615',
      supplier: supplier.toBase58(),
      client: clientWallet.toBase58(),
      reporter: reporter.toBase58(),
    };

    const fresh = { ...input, treeId: '18446744073709551614' };
    const tx = await client.build(creator.publicKey.toBase58(), fresh);
    const data = decoded(tx).data as { tree_id: BN; target: BN };
    expect(data.tree_id.toString()).toBe(fresh.treeId);
    expect(data.target.toString()).toBe(input.target);
    const address = treeAddress(creator.publicKey, fresh.treeId);
    const keys = tx.instructions[0].keys.map((key) => key.pubkey.toBase58());
    expect(keys).toContain(address.toBase58());
    expect(keys).toContain(shareMintAddress(address).toBase58());
    expect(keys).toContain(fundingVaultAddress(address).toBase58());
    expect(keys).toContain(revenueVaultAddress(address).toBase58());
    const funded = await client.build(creator.publicKey.toBase58(), {
      ...fresh,
      reporterFundingLamports: '50000000',
    });
    expect(funded.instructions).toHaveLength(2);
    const transfer = SystemInstruction.decodeTransfer(funded.instructions[1]!);
    expect(transfer.fromPubkey.equals(creator.publicKey)).toBe(true);
    expect(transfer.toPubkey.equals(reporter)).toBe(true);
    expect(transfer.lamports).toBe(50000000n);
    const topUp = await client.build(creator.publicKey.toBase58(), {
      action: 'fundReporter',
      tree: backendTree('active'),
      amount: '50000000',
    });
    expect(
      SystemInstruction.decodeTransfer(topUp.instructions[0]!).toPubkey.equals(
        reporter,
      ),
    ).toBe(true);
    await expect(
      client.build(other.publicKey.toBase58(), fresh),
    ).rejects.toThrow('chain admin');
  });
  test('funded purchase creates the supplier ATA atomically and requires the creator', async () => {
    const { client } = await fixture({ phase: 'Funded' });
    const tx = await client.build(creator.publicKey.toBase58(), {
      action: 'purchaseTree',
      tree: backendTree('funded'),
    });
    expect(tx.instructions.length).toBe(2);
    expect(
      tx.instructions[0].programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID),
    ).toBe(true);
    expect(
      tx.instructions[0].keys[1].pubkey.equals(paymentAtaAddress(supplier)),
    ).toBe(true);
    expect(decoded(tx).name).toBe('purchase_tree');
    await expect(
      client.build(other.publicKey.toBase58(), {
        action: 'purchaseTree',
        tree: backendTree('funded'),
      }),
    ).rejects.toThrow('creator');
  });
  test('activation accepts past UTC days and validates phase; invoices bind the report to its tree', async () => {
    const { client } = await fixture();
    const tx = await client.build(creator.publicKey.toBase58(), {
      action: 'activateTree',
      tree: backendTree(),
      firstDay: nextUtcDay(),
    });
    expect(decoded(tx).name).toBe('activate_tree');
    expect(
      (
        decoded(tx).data as { first_day_start_ts: BN }
      ).first_day_start_ts.toNumber() % 86400,
    ).toBe(0);
    const historicalActivation = await client.build(
      creator.publicKey.toBase58(),
      {
        action: 'activateTree',
        tree: backendTree(),
        firstDay: '2020-01-01',
      },
    );
    expect(
      (
        decoded(historicalActivation).data as { first_day_start_ts: BN }
      ).first_day_start_ts.toString(),
    ).toBe('1577836800');
    const active = await fixture({ phase: 'Active' });
    const reports = [
      {
        address: reportAddress(tree, dayStartTs).toBase58(),
        dayStartTs,
        totalWh: '96',
        invoiceIssued: false,
        due: '0',
        paid: '0',
      },
    ];
    const invoice = await active.client.build(creator.publicKey.toBase58(), {
      action: 'issueInvoice',
      tree: backendTree('active'),
      report: reports[0],
      amount: '0',
    });
    expect(decoded(invoice).name).toBe('issue_invoice');
    const billed = await fixture({ phase: 'Active', invoice: true });
    await expect(
      billed.client.build(creator.publicKey.toBase58(), {
        action: 'issueInvoice',
        tree: backendTree('active'),
        report: { ...reports[0]!, invoiceIssued: true },
        amount: '1',
      }),
    ).rejects.toThrow('already');
    await expect(
      active.client.build(creator.publicKey.toBase58(), {
        action: 'activateTree',
        tree: backendTree('active'),
        firstDay: nextUtcDay(),
      }),
    ).rejects.toThrow('Purchase');
  });
  test('browser-built transaction is wallet signed, broadcast directly and confirmed', async () => {
    const { client, sent, methods } = await fixture();
    const submitted: string[] = [];
    const signature = await client.execute(
      signedWallet(),
      { action: 'giveMeMoney', amount: '1000000' },
      (signature) => submitted.push(signature),
    );
    expect(submitted).toEqual([signature]);
    expect(sent.length).toBe(1);
    expect(sent[0].verifySignatures()).toBe(true);
    expect(sent[0].feePayer?.equals(creator.publicKey)).toBe(true);
    expect(decoded(sent[0]).name).toBe('give_me_money');
    expect(methods).toContain('sendTransaction');
    const sendOnly = await fixture();
    const sendOnlySignature = await sendOnly.client.execute(
      { ...signedWallet(), signTransaction: undefined },
      { action: 'giveMeMoney', amount: '1000000' },
      () => {},
    );
    expect(sendOnlySignature).toBe(bs58.encode(sendOnly.sent[0].signature!));
    expect(sendOnly.sent[0].verifySignatures()).toBe(true);
    const failed = await fixture({ failed: true });
    await expect(
      failed.client.execute(
        signedWallet(),
        { action: 'giveMeMoney', amount: '1' },
        () => {},
      ),
    ).rejects.toThrow('Transaction failed');
    const wrongNetwork = await fixture({ genesis: 'wrong-network' });
    await expect(
      wrongNetwork.client.build(creator.publicKey.toBase58(), {
        action: 'giveMeMoney',
        amount: '1',
      }),
    ).rejects.toThrow('devnet');
    expect(wrongNetwork.methods).not.toContain('sendTransaction');
  });
});
