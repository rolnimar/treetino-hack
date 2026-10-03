import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const localAnchor = resolve(root, 'target/tooling/bin/anchor');
const anchor = existsSync(localAnchor) ? localAnchor : 'anchor';
const result = Bun.spawnSync(
  [
    'rtk',
    'proxy',
    anchor,
    'idl',
    'build',
    '--out',
    'packages/contracts/src/idl/treetino.json',
    '--out-ts',
    'packages/contracts/src/types/treetino.ts',
  ],
  { cwd: root, stdout: 'inherit', stderr: 'inherit' },
);
if (result.exitCode !== 0) process.exit(result.exitCode);

const idl = (await Bun.file(
  resolve(root, 'packages/contracts/src/idl/treetino.json'),
).json()) as {
  errors: Array<{ name: string; code: number }>;
};
const codes = Object.fromEntries(
  idl.errors.map(({ name, code }) => [name, code]),
);
await Bun.write(
  resolve(root, 'packages/contracts/src/types/treetino_errors.ts'),
  '// Generated from the Anchor IDL. Run bun run idl to refresh.\n' +
    'export const TreetinoErrorCode = ' +
    JSON.stringify(codes, null, 2) +
    ' as const;\n\n' +
    'export type TreetinoErrorName = keyof typeof TreetinoErrorCode;\n',
);
