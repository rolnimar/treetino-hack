import { z } from 'zod';
import {
  addressSchema,
  walletSchema,
  u64Schema,
  positiveU64Schema,
  treeSchema,
  tokenAmountInput,
} from '../../lib/schemas';
const walletsSchema = z
  .array(walletSchema)
  .min(1, 'At least one admin is required')
  .max(10, 'At most ten admins are allowed')
  .refine(
    (wallets) => new Set(wallets).size === wallets.length,
    'Remove duplicate wallets',
  );
export const futureDaySchema = z.iso
  .date()
  .refine(
    (value) => Date.parse(value + 'T00:00:00Z') > Date.now(),
    'Choose a future UTC billing day',
  );
export const adminsFormSchema = z.object({
  wallets: z
    .string()
    .trim()
    .transform((value) => value.split(/[\s,]+/).filter(Boolean))
    .pipe(walletsSchema),
});
export const createTreeFormSchema = z.object({
  treeId: u64Schema,
  target: tokenAmountInput(),
  supplier: walletSchema,
  client: walletSchema,
  reporter: walletSchema,
});
export const createCampaignFormSchema = createTreeFormSchema.extend({
  title: z.string().min(2, 'Enter a campaign title'),
  subtitle: z.string().optional(),
  category: z.string().min(2, 'Enter a category'),
  categoryBadge: z.string().min(2, 'Enter a category badge'),
  narrative: z.string().min(10, 'Provide a short narrative pitch'),
  story: z.string().optional(),
  investorHighlight: z.string().optional(),
  victronSiteId: z.number().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  projectedApy: z.string().min(1, 'Enter projected APY (e.g. 14.2%)'),
  tariffRate: z.string().min(1, 'Enter tariff rate (e.g. $0.40/kWh)'),
  offTakerName: z.string().min(1, 'Enter off-taker name'),
  offTakerDescription: z.string().optional(),
  supplierName: z.string().optional(),
});
export const activationFormSchema = z.object({ firstDay: futureDaySchema });
export const invoiceFormSchema = z.object({
  report: addressSchema,
  amount: tokenAmountInput(true),
});
export const faucetFormSchema = z.object({ amount: tokenAmountInput() });
export const reportSchema = z.object({
  address: addressSchema,
  dayStartTs: z.string().regex(/^[0-9]+$/),
  totalWh: u64Schema,
  invoiceIssued: z.boolean(),
  due: u64Schema,
  paid: u64Schema,
});
export const reportsSchema = z.array(reportSchema);
export const chainStateSchema = z.object({
  network: z.literal('devnet'),
  programId: addressSchema,
  programData: addressSchema,
  upgradeAuthority: addressSchema.nullable(),
  adminConfig: addressSchema,
  adminsInitialized: z.boolean(),
  admins: z.array(addressSchema),
  paymentMint: addressSchema,
  paymentTokenInitialized: z.boolean(),
  wallet: addressSchema,
  balanceLamports: u64Schema,
});
export const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.enum(['initAdmins', 'setAdmins']),
    wallets: walletsSchema,
  }),
  z.object({ action: z.literal('initPaymentToken') }),
  z.object({
    action: z.literal('initTree'),
    treeId: u64Schema,
    target: positiveU64Schema,
    supplier: walletSchema,
    client: walletSchema,
    reporter: walletSchema,
  }),
  z.object({ action: z.literal('purchaseTree'), tree: treeSchema }),
  z.object({
    action: z.literal('activateTree'),
    tree: treeSchema,
    firstDay: futureDaySchema,
  }),
  z.object({
    action: z.literal('issueInvoice'),
    tree: treeSchema,
    report: reportSchema,
    amount: u64Schema,
  }),
  z.object({ action: z.literal('giveMeMoney'), amount: positiveU64Schema }),
]);
export type AdminAction = z.infer<typeof actionSchema>;
export type ChainState = z.infer<typeof chainStateSchema>;
export type ProductionReport = z.infer<typeof reportSchema>;
