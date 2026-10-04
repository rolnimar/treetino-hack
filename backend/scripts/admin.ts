import 'reflect-metadata';
import { eq } from 'drizzle-orm';
import { DatabaseConfig } from '../src/database/database.config';
import { DatabaseService } from '../src/database/database.service';
import { admins } from '../src/database/schema';
import { validateWallet } from '../src/auth/auth.service';
const [action, input] = process.argv.slice(2);
if (!['add', 'remove', 'list'].includes(action ?? ''))
  throw new Error('Usage: bun run admin -- add|remove <wallet> OR list');
const wallet = action === 'list' ? undefined : validateWallet(input);
const database = await DatabaseService.create(new DatabaseConfig());
try {
  if (action === 'add')
    await database.db
      .insert(admins)
      .values({ wallet: wallet! })
      .onConflictDoNothing();
  if (action === 'remove')
    await database.db.delete(admins).where(eq(admins.wallet, wallet!));
  console.table(await database.db.select().from(admins));
} finally {
  await database.onApplicationShutdown();
}
