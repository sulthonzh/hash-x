import { test } from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const CLI = join(process.cwd(), 'cli.js');
const TMP = mkdtempSync(join(tmpdir(), 'hash-x-cli-'));

// Helper: run CLI with args, return stdout (string)
function run(args, opts = {}) {
  return execFileSync('node', [CLI, ...args], {
    encoding: 'utf8',
    ...opts,
  }).trim();
}

// Helper: run CLI and expect it to exit with a code
function runExpectCode(args, expectedCode) {
  try {
    execFileSync('node', [CLI, ...args], { encoding: 'utf8', stdio: 'pipe' });
    assert.fail(`Expected exit code ${expectedCode}, but process exited normally`);
  } catch (err) {
    assert.strictEqual(err.status, expectedCode, `Expected exit code ${expectedCode}`);
    return err.stderr?.trim() || '';
  }
}

test('CLI: --help shows usage', () => {
  const out = run(['--help']);
  assert.match(out, /Usage:/);
  assert.match(out, /hash-x/);
  assert.match(out, /Algorithms:/);
});

test('CLI: -h short flag shows usage', () => {
  const out = run(['-h']);
  assert.match(out, /Usage:/);
});

test('CLI: no args shows usage', () => {
  const out = run([]);
  assert.match(out, /Usage:/);
});

test('CLI: --version shows version', () => {
  const out = run(['--version']);
  assert.match(out, /^\d+\.\d+\.\d+$/);
});

test('CLI: -V short flag shows version', () => {
  const out = run(['-V']);
  assert.match(out, /^\d+\.\d+\.\d+$/);
});

test('CLI: --list shows all algorithms', () => {
  const out = run(['--list']);
  const algos = out.split('\n');
  assert.ok(algos.length >= 8);
  assert.ok(algos.includes('murmurhash3_32'));
  assert.ok(algos.includes('crc32'));
});

test('CLI: demo mode shows hash table', () => {
  const out = run(['demo']);
  assert.match(out, /Algorithm/);
  assert.match(out, /murmurhash3_32/);
});

test('CLI: hash a string with crc32', () => {
  const out = run(['crc32', 'hello']);
  // Should be a number (uint32)
  assert.match(out, /^\d+$/);
});

test('CLI: hash with --hex outputs hex', () => {
  const out = run(['crc32', 'hello', '--hex']);
  assert.match(out, /^[0-9a-f]+$/);
});

test('CLI: hash with --seed for murmurhash3_32', () => {
  const out1 = run(['murmurhash3_32', 'test', '--seed', '0']);
  const out2 = run(['murmurhash3_32', 'test', '--seed', '42']);
  assert.notStrictEqual(out1, out2);
});

test('CLI: hash with --file reads file content', () => {
  const filePath = join(TMP, 'test.txt');
  writeFileSync(filePath, 'hello');
  const out = run(['crc32', '--file', filePath]);
  // Should match crc32('hello') = 0x3610a686 = 907060870
  assert.strictEqual(out, '907060870');
});

test('CLI: --hex with 64-bit algorithm outputs 16-char hex', () => {
  const out = run(['fnv1a_64', 'hello', '--hex']);
  assert.strictEqual(out.length, 16);
  assert.match(out, /^[0-9a-f]+$/);
});

test('CLI: 64-bit algorithm outputs bigint as string', () => {
  const out = run(['fnv1a_64', 'hello']);
  // fnv1a_64 returns bigint, printed as decimal string
  assert.match(out, /^\d+$/);
});

test('CLI: unknown algorithm exits with code 1', () => {
  const err = runExpectCode(['nonexistent', 'test'], 1);
  assert.match(err, /Unknown algorithm/);
});

test('CLI: unknown flag exits with code 2', () => {
  const err = runExpectCode(['crc32', 'hello', '--bogus'], 2);
  assert.match(err, /Unknown flag/);
});

test('CLI: invalid seed exits with code 2', () => {
  const err = runExpectCode(['murmurhash3_32', 'test', '--seed', 'abc'], 2);
  assert.match(err, /Invalid seed/);
});

test('CLI: --file without path exits with code 2', () => {
  const err = runExpectCode(['crc32', '--file'], 2);
  assert.match(err, /requires a path/);
});

// Cleanup
test('CLI: cleanup temp files', () => {
  rmSync(TMP, { recursive: true, force: true });
  assert.ok(true);
});
