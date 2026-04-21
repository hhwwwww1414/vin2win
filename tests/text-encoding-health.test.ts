import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const UTF16_LE_BOM = Buffer.from([0xff, 0xfe]);
const UTF16_BE_BOM = Buffer.from([0xfe, 0xff]);

const TEXT_FILE_PATTERN =
  /\.(?:[cm]?js|jsx|ts|tsx|json|md|mdx|txt|css|scss|sass|less|html|svg|ya?ml|env|sh|ps1|sql|prisma|d\.ts)(?:\.bak[^/]*)?$/i;
const TEXT_FILE_NAMES = new Set(['.gitignore']);
const SKIP_PATH_PATTERN =
  /^(?:node_modules|vendor|playwright-report|test-results|\.next|\.cursor|\.superpowers)\//;
const SKIP_FILE_PATTERN = /\.(?:png|jpe?g|gif|webp|ico|pdf|zip|tar|gz|mp4|mov|webm|csv|riv)$/i;

const MOJIBAKE_PATTERNS = [
  {
    label: 'replacement character',
    regex: /\uFFFD/u,
  },
  {
    label: 'UTF-8/CP1251 mojibake',
    regex:
      /[\u0420\u0421][\u00A0-\u045F\u2010-\u2122][\u0420\u0421][\u00A0-\u045F\u2010-\u2122][\u0420\u0421][\u00A0-\u045F\u2010-\u2122]/u,
  },
  {
    label: 'Windows-1252 mojibake',
    regex: /(?:вЂ|в‚)/u,
  },
];

function listTrackedTextFiles() {
  const output = execFileSync('git', ['ls-files'], { encoding: 'utf8' });

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => !SKIP_PATH_PATTERN.test(file))
    .filter((file) => !SKIP_FILE_PATTERN.test(file))
    .filter((file) => TEXT_FILE_PATTERN.test(file) || TEXT_FILE_NAMES.has(file));
}

function scanFile(file: string) {
  const buffer = readFileSync(file);
  const findings: string[] = [];

  if (buffer.subarray(0, 2).equals(UTF16_LE_BOM) || buffer.subarray(0, 2).equals(UTF16_BE_BOM)) {
    findings.push('stored as UTF-16');
  }

  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of MOJIBAKE_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push(`${pattern.label} at line ${index + 1}: ${line.trim()}`);
        break;
      }
    }
  });

  return findings;
}

test('tracked source files keep UTF-8 encoding and readable text literals', () => {
  const findings = listTrackedTextFiles().flatMap((file) =>
    scanFile(file).map((issue) => `${file}: ${issue}`)
  );

  assert.deepEqual(
    findings,
    [],
    `Found encoding issues:\n${findings.map((issue) => `- ${issue}`).join('\n')}`
  );
});
