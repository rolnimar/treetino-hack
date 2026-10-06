import {
  PublicKey,
  SystemProgram,
  Transaction,
  type Connection,
} from '@solana/web3.js';
import { actionSchema, type AdminAction } from '../features/admin/schemas';
import {
  treeAddress,
  shareMintAddress,
  paymentMintAddress,
  reportAddress,
} from './addresses';
import { readProtocolState } from './read';
import {
  initAdminsInstruction,
  setAdminsInstruction,
  initPaymentTokenInstruction,
  initTreeInstruction,
  purchaseTreeInstructions,
  activateTreeInstruction,
  issueInvoiceInstruction,
  giveMeMoneyInstruction,
  submitReportInstruction,
} from './instructions';
/** Uses backend tree records; no tree accounts are fetched from RPC. */
export async function buildAdminTransaction(
  connection: Connection,
  wallet: string,
  value: AdminAction,
) {
  const input = actionSchema.parse(value);
  const state = await readProtocolState(connection, wallet);
  const signer = new PublicKey(wallet);
  const transaction = new Transaction();
  switch (input.action) {
    case 'simulateReport': {
      const info = input.tree;
      const tree = new PublicKey(info.address);
      if (info.reporter !== wallet)
        throw new Error(
          'Only the configured reporter wallet can submit reports',
        );
      if (info.phase !== 'active')
        throw new Error('Activate the tree before reporting');
      if (!treeAddress(new PublicKey(info.creator), info.treeId).equals(tree))
        throw new Error(
          'Backend tree address does not match the program seeds',
        );
      transaction.add(
        submitReportInstruction(signer, tree, input.dayStartTs, input.wh),
      );
      break;
    }
    case 'initAdmins':
    case 'setAdmins': {
      if (state.upgradeAuthority !== wallet)
        throw new Error(
          'Only the program upgrade authority can manage chain admins',
        );
      if (input.action === 'initAdmins' && state.adminsInitialized)
        throw new Error('Chain admins are already initialized');
      if (input.action === 'setAdmins' && !state.adminsInitialized)
        throw new Error('Initialize chain admins first');
      const admins = input.wallets.map((wallet) => new PublicKey(wallet));
      transaction.add(
        (input.action === 'initAdmins'
          ? initAdminsInstruction
          : setAdminsInstruction)(
          signer,
          new PublicKey(state.programData),
          admins,
        ),
      );
      break;
    }
    case 'fundReporter': {
      if (
        input.tree.creator !== wallet ||
        !treeAddress(signer, input.tree.treeId).equals(
          new PublicKey(input.tree.address),
        )
      )
        throw new Error('Only this tree’s creator can fund its reporter');
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: signer,
          toPubkey: new PublicKey(input.tree.reporter),
          lamports: BigInt(input.amount),
        }),
      );
      break;
    }
    case 'initPaymentToken': {
      if (state.paymentTokenInitialized)
        throw new Error('Payment token is already initialized');
      transaction.add(initPaymentTokenInstruction(signer));
      break;
    }
    case 'initTree': {
      if (!state.admins.includes(wallet))
        throw new Error('Your wallet is not in the chain admin list');
      if (!state.paymentTokenInitialized)
        throw new Error('Initialize the payment token first');
      const treeId = input.treeId;
      const tree = treeAddress(signer, treeId);
      const supplier = new PublicKey(input.supplier);
      const client = new PublicKey(input.client);
      const reporter = new PublicKey(input.reporter);
      if ([supplier, client, reporter].some((wallet) => wallet.equals(tree)))
        throw new Error('Tree roles cannot use the tree PDA');
      const target = input.target;
      transaction.add(
        initTreeInstruction(signer, {
          treeId,
          target,
          supplier,
          client,
          reporter,
        }),
      );
      if (
        input.reporterFundingLamports &&
        BigInt(input.reporterFundingLamports) > 0n
      )
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: signer,
            toPubkey: reporter,
            lamports: BigInt(input.reporterFundingLamports),
          }),
        );
      break;
    }
    case 'giveMeMoney': {
      if (!state.paymentTokenInitialized)
        throw new Error('Initialize the payment token first');
      transaction.add(giveMeMoneyInstruction(signer, input.amount));
      break;
    }
    case 'purchaseTree':
    case 'activateTree':
    case 'issueInvoice': {
      const info = input.tree;
      const tree = new PublicKey(info.address);
      if (info.creator !== wallet)
        throw new Error('Only this tree’s creator can perform this action');
      if (
        !treeAddress(signer, info.treeId).equals(tree) ||
        !shareMintAddress(tree).equals(new PublicKey(info.shareMint))
      )
        throw new Error(
          'Backend tree addresses do not match the program seeds',
        );
      if (input.action === 'purchaseTree') {
        if (info.phase !== 'funded')
          throw new Error('Tree must be fully funded before purchase');
        if (info.paymentMint !== paymentMintAddress().toBase58())
          throw new Error('Tree uses an incompatible payment mint');
        transaction.add(...purchaseTreeInstructions(signer, info));
      } else if (input.action === 'activateTree') {
        if (info.phase !== 'purchased')
          throw new Error('Purchase the tree before activation');
        const timestamp = Date.parse(input.firstDay + 'T00:00:00Z');
        transaction.add(
          activateTreeInstruction(signer, info, BigInt(timestamp / 1000)),
        );
      } else {
        if (info.phase !== 'active')
          throw new Error('Activate the tree before issuing invoices');
        const reportKey = new PublicKey(input.report.address);
        if (!reportAddress(tree, input.report.dayStartTs).equals(reportKey))
          throw new Error('Report does not belong to this tree');
        if (input.report.invoiceIssued)
          throw new Error('This report already has an invoice');
        transaction.add(
          issueInvoiceInstruction(signer, tree, reportKey, input.amount),
        );
      }
      break;
    }
    default:
      throw new Error('Unknown admin action');
  }
  transaction.feePayer = signer;
  return transaction;
}
