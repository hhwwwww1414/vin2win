import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SCRIPT_PATH = pathToFileURL(path.resolve('scripts/load-env.ts')).href;

test('load-env keeps an explicitly provided DATABASE_URL instead of overwriting it from .env files', () => {
  const workspace = mkdtempSync(path.join(tmpdir(), 'vin2win-load-env-'));

  try {
    writeFileSync(path.join(workspace, '.env'), "DATABASE_URL=postgresql://from-env-file\n", 'utf8');
    writeFileSync(path.join(workspace, '.env.local'), "DATABASE_URL=postgresql://from-env-local\n", 'utf8');

    const output = execFileSync(
      process.execPath,
      [
        '--import',
        'tsx',
        '--eval',
        [
          `process.chdir(${JSON.stringify(workspace)});`,
          "process.env.DATABASE_URL = 'postgresql://from-process-env';",
          `await import(${JSON.stringify(SCRIPT_PATH)});`,
          'process.stdout.write(process.env.DATABASE_URL ?? "");',
        ].join(' '),
      ],
      { encoding: 'utf8' }
    );

    assert.equal(output, 'postgresql://from-process-env');
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
