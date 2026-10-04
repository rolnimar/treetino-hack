import { z } from 'zod';
import bs58 from 'bs58';
import type { TreeInfo } from '@treetino/contracts';
import { parseTokenAmount } from '../chain/amounts';
export const addressSchema = z
  .string()
  .min(32)
  .max(44)
  .refine((value) => {
    try {
      return bs58.decode(value).length === 32;
    } catch {
      return false;
    }
  }, 'Enter a valid Solana address');
export const walletSchema = addressSchema.refine(
  (value) => value !== '11111111111111111111111111111111',
  'The zero address cannot be used',
);
export const u64Schema = z
  .string()
  .regex(/^(0|[1-9][0-9]{0,19})$/, 'Enter a whole number')
  .refine(
    (value) =>
      /^(0|[1-9][0-9]{0,19})$/.test(value) &&
      BigInt(value) <= 18446744073709551615n,
    'Value exceeds u64',
  );
export const positiveU64Schema = u64Schema.refine(
  (value) => value !== '0',
  'Must be greater than zero',
);
/** Converts human mockUSDC input into exact six-decimal base units. */
export const tokenAmountInput = (zero = false) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      try {
        parseTokenAmount(value, zero);
      } catch (error) {
        ctx.addIssue({
          code: 'custom',
          message: error instanceof Error ? error.message : 'Invalid amount',
        });
      }
    })
    .transform((value) => parseTokenAmount(value, zero));
export const phaseSchema = z.enum(['funding', 'funded', 'purchased', 'active']);
export const treeSchema = z.object({
  id: z.uuid(),
  address: addressSchema,
  treeId: u64Schema,
  creator: addressSchema,
  supplier: addressSchema,
  client: addressSchema,
  reporter: addressSchema,
  paymentMint: addressSchema,
  shareMint: addressSchema,
  fundingTokenAccount: addressSchema,
  target: u64Schema,
  raised: u64Schema,
  remaining: u64Schema,
  phase: phaseSchema,
  canBuy: z.boolean(),
  updatedAt: z.iso.datetime(),
  signature: z.string(),
}) satisfies z.ZodType<TreeInfo>;
export const treesResponseSchema = z.object({
  trees: z.array(treeSchema),
  total: z.number().int().nonnegative(),
});
export const adminSchema = z.object({ id: z.uuid(), wallet: walletSchema });
export const challengeSchema = z.object({
  id: z.uuid(),
  message: z.string().min(1),
  expiresAt: z.iso.datetime(),
});
export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.iso.datetime(),
  admin: adminSchema,
});
export const protocolSchema = z.object({
  name: z.literal('treetino'),
  network: z.literal('devnet'),
  programId: addressSchema,
});
export type IndexedTree = z.infer<typeof treeSchema>;
export type AdminSession = z.infer<typeof sessionSchema>;
