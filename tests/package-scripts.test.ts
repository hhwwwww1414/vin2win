import test from 'node:test';
import assert from 'node:assert/strict';
import packageJson from '@/package.json';

test('build script regenerates prisma client before next build', () => {
  const buildScript = packageJson.scripts.build;

  assert.match(buildScript, /\bdb:generate\b/);
  assert.match(buildScript, /\bnext build\b/);
});
