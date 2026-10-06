import { afterEach, describe, expect, test } from 'bun:test';
import { readTreeRewards } from '../src/chain/rewards';
import {
  buildPublicTransaction,
  readMockUsdcBalance,
} from '../src/chain/public';
import { sendWalletTransaction } from '../src/chain/transaction';
import {
  PROGRAM_ID,
  paymentAtaAddress,
  positionAddress,
  revenueVaultAddress,
} from '../src/chain/addresses';
import {
  backendTree,
  cleanup,
  coder,
  creator,
  fixture,
  other,
  setInvestorRewards,
  setTokenBalance,
  signedWallet,
  tree,
} from './fixtures/chain';

afterEach(cleanup);
const info = () => backendTree('active');

describe('paid invoice investor rewards', () => {
  test('two payments accumulate exactly and a signed claim refreshes balance and prevents a repeat', async () => {
    const f = await fixture({
      phase: 'Active',
      onSend: async (tx, accounts) => {
        expect(tx.verifySignatures()).toBe(true);
        expect(coder.instruction.decode(tx.instructions[1]!.data)?.name).toBe(
          'claim_rewards',
        );
        setTokenBalance(accounts, other.publicKey, 5_000_000n);
        await setInvestorRewards(accounts, {
          claimed: 5_000_000n,
          positionIndex: 250_000_000_000_000n,
        });
      },
    });
    // First invoice 2 mockUSDC; second adds 3 mockUSDC.
    await setInvestorRewards(f.accounts, {
      paid: 2_000_000n,
      index: 100_000_000_000_000n,
    });
    const read = () =>
      readTreeRewards(f.client.connection, other.publicKey.toBase58(), info());
    expect((await read()).claimable).toBe('2000000');
    await setInvestorRewards(f.accounts);
    expect(await read()).toMatchObject({
      claimable: '5000000',
      canClaim: true,
    });
    expect(f.accounts.has(paymentAtaAddress(other.publicKey).toBase58())).toBe(
      false,
    );
    const build = () =>
      buildPublicTransaction(f.client.connection, other.publicKey.toBase58(), {
        action: 'claimRewards',
        tree: info(),
      });
    const tx = await build();
    const ix = tx.instructions[1]!;
    expect(ix.programId.equals(PROGRAM_ID)).toBe(true);
    expect(ix.keys.map((key) => key.pubkey.toBase58()).slice(0, 5)).toEqual([
      other.publicKey.toBase58(),
      tree.toBase58(),
      positionAddress(tree, other.publicKey).toBase58(),
      revenueVaultAddress(tree).toBase58(),
      paymentAtaAddress(other.publicKey).toBase58(),
    ]);
    expect(ix.keys[0]!.isSigner).toBe(true);
    await sendWalletTransaction(
      f.client.connection,
      signedWallet(other),
      tx,
      () => {},
    );
    expect(
      (
        await readMockUsdcBalance(
          f.client.connection,
          other.publicKey.toBase58(),
        )
      ).balance,
    ).toBe('5000000');
    expect(await read()).toMatchObject({ claimable: '0', canClaim: false });
    await expect(build()).rejects.toThrow('No rewards');
    expect(f.sent).toHaveLength(1);
    expect(f.methods).not.toContain('getProgramAccounts');
  });

  test('proportional ownership, checkpointed rewards and fractional dust match the contract', async () => {
    const f = await fixture({ phase: 'Active' });
    const read = () =>
      readTreeRewards(f.client.connection, other.publicKey.toBase58(), info());
    await setInvestorRewards(f.accounts, { shares: 4_000_000_000n });
    expect((await read()).claimable).toBe('1000000'); // 20% of 5 mockUSDC
    await setInvestorRewards(f.accounts, {
      shares: 4_000_000_000n,
      positionIndex: 100_000_000_000_000n,
      pendingScaled:
        400_000n * 1_000_000_000_000_000_000n + 999_999_999_999_999_999n,
    });
    expect((await read()).claimable).toBe('1000000');
    // After transferring all shares, previously earned rewards remain claimable.
    await setInvestorRewards(f.accounts, {
      shares: 0n,
      positionIndex: 250_000_000_000_000n,
      pendingScaled: 2_000_000n * 1_000_000_000_000_000_000n,
    });
    expect(await read()).toMatchObject({
      shares: '0',
      claimable: '2000000',
      canClaim: true,
    });
  });

  test('non-investors, dust-only positions, inactive trees and drained vaults cannot claim', async () => {
    const f = await fixture({ phase: 'Active' });
    await setInvestorRewards(f.accounts);
    expect(
      await readTreeRewards(
        f.client.connection,
        creator.publicKey.toBase58(),
        info(),
      ),
    ).toMatchObject({ hasPosition: false, claimable: '0', canClaim: false });
    const build = () =>
      buildPublicTransaction(f.client.connection, other.publicKey.toBase58(), {
        action: 'claimRewards',
        tree: info(),
      });
    await setInvestorRewards(f.accounts, {
      shares: 0n,
      pendingScaled: 999_999_999_999_999_999n,
    });
    await expect(build()).rejects.toThrow('No rewards');
    await setInvestorRewards(f.accounts, { vaultBalance: 4_999_999n });
    expect(
      (
        await readTreeRewards(
          f.client.connection,
          other.publicKey.toBase58(),
          info(),
        )
      ).canClaim,
    ).toBe(false);
    await expect(build()).rejects.toThrow('revenue vault');
    const inactive = await fixture({ phase: 'Purchased' });
    await setInvestorRewards(inactive.accounts);
    await expect(
      buildPublicTransaction(
        inactive.client.connection,
        other.publicKey.toBase58(),
        { action: 'claimRewards', tree: info() },
      ),
    ).rejects.toThrow('active tree');
  });

  test('rejects forged account owners, malformed positions and inconsistent reward checkpoints', async () => {
    const f = await fixture({ phase: 'Active' });
    await setInvestorRewards(f.accounts);
    const read = () =>
      readTreeRewards(f.client.connection, other.publicKey.toBase58(), info());
    const key = positionAddress(tree, other.publicKey).toBase58();
    const position = f.accounts.get(key)!;
    position.owner = creator.publicKey;
    await expect(read()).rejects.toThrow('account owner');
    position.owner = PROGRAM_ID;
    const original = position.data;
    position.data = await coder.accounts.encode('Position', {
      ...coder.accounts.decode<Record<string, unknown>>('Position', original),
      owner: creator.publicKey,
    });
    await expect(read()).rejects.toThrow('investor position');
    await setInvestorRewards(f.accounts, {
      positionIndex: 250_000_000_000_001n,
    });
    await expect(read()).rejects.toThrow('reward accounting');
    await setInvestorRewards(f.accounts, {
      claimed: 5_000_001n,
      vaultBalance: 0n,
    });
    await expect(read()).rejects.toThrow('reward accounting');
    await setInvestorRewards(f.accounts);
    const vault = f.accounts.get(revenueVaultAddress(tree).toBase58())!;
    creator.publicKey.toBuffer().copy(vault.data, 32);
    await expect(read()).rejects.toThrow('revenue account');
    vault.data = Buffer.alloc(1);
    await expect(read()).rejects.toThrow();
    await setInvestorRewards(f.accounts, {
      shares: (1n << 64n) - 1n,
      index: (1n << 128n) - 1n,
    });
    await expect(read()).rejects.toThrow('reward accounting');
  });
});
