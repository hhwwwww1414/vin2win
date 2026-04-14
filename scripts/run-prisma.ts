import path from 'node:path';
import { spawn } from 'node:child_process';
import './load-env';

const args = process.argv.slice(2);
const prismaExecutable = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
);

const child =
  process.platform === 'win32'
    ? spawn(`"${prismaExecutable}" ${args.join(' ')}`, {
        stdio: 'inherit',
        env: process.env,
        shell: true,
      })
    : spawn(prismaExecutable, args, {
        stdio: 'inherit',
        env: process.env,
      });

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
