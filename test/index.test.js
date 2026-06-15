'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const {
  crc32, adler32, djb2, javaHash,
  fnv1a_32, fnv1a_64,
  murmurhash3_32, xxhash32,
  toHex, combine, hash, listAlgorithms,
} = require('../index');

// ─── CRC32 ───────────────────────────────────────────────────────

test('crc32: empty input = 0', () => {
  assert.strictEqual(crc32(''), 0);
});

test('crc32: standard check value (123456789)', () => {
  assert.strictEqual(crc32('123456789'), 0xcbf43926);
});

test('crc32: known value for "hello"', () => {
  assert.strictEqual(crc32('hello'), 0x3610a686);
});

test('crc32: deterministic', () => {
  assert.strictEqual(crc32('test'), crc32('test'));
  assert.notStrictEqual(crc32('test'), crc32('TEST'));
});

test('crc32: Buffer and string match', () => {
  assert.strictEqual(crc32(Buffer.from('hello')), crc32('hello'));
});

// ─── Adler-32 ────────────────────────────────────────────────────

test('adler32: empty = 1', () => {
  assert.strictEqual(adler32(''), 1);
});

test('adler32: Wikipedia known value', () => {
  assert.strictEqual(adler32('Wikipedia'), 0x11E60398);
});

test('adler32: deterministic', () => {
  assert.strictEqual(adler32('abc'), adler32('abc'));
});

// ─── DJB2 ────────────────────────────────────────────────────────

test('djb2: empty = 5381', () => {
  assert.strictEqual(djb2(''), 5381);
});

test('djb2: deterministic', () => {
  assert.strictEqual(djb2('hello'), djb2('hello'));
  assert.notStrictEqual(djb2('hello'), djb2('world'));
});

// ─── Java Hash ───────────────────────────────────────────────────

test('javaHash: empty = 0', () => {
  assert.strictEqual(javaHash(''), 0);
});

test('javaHash: signed 32-bit', () => {
  // Java's hashCode can return negative values
  const h = javaHash('some longer string that might overflow');
  assert.strictEqual(typeof h, 'number');
  assert.ok(Number.isInteger(h));
});

// ─── FNV-1a 32-bit ───────────────────────────────────────────────

test('fnv1a_32: empty = FNV offset basis', () => {
  assert.strictEqual(fnv1a_32(''), 0x811c9dc5);
});

test('fnv1a_32: known "foobar" vector', () => {
  assert.strictEqual(fnv1a_32('foobar'), 0xbf9cf968);
});

test('fnv1a_32: known "a" vector', () => {
  assert.strictEqual(fnv1a_32('a'), 0xe40c292c);
});

test('fnv1a_32: deterministic', () => {
  assert.strictEqual(fnv1a_32('test'), fnv1a_32('test'));
});

// ─── FNV-1a 64-bit ───────────────────────────────────────────────

test('fnv1a_64: empty = FNV-64 offset basis', () => {
  assert.strictEqual(fnv1a_64(''), 0xcbf29ce484222325n);
});

test('fnv1a_64: returns bigint', () => {
  assert.strictEqual(typeof fnv1a_64('test'), 'bigint');
});

test('fnv1a_64: deterministic', () => {
  assert.strictEqual(fnv1a_64('abc'), fnv1a_64('abc'));
});

// ─── MurmurHash3 32-bit ──────────────────────────────────────────

test('murmurhash3_32: deterministic', () => {
  assert.strictEqual(murmurhash3_32('hello'), murmurhash3_32('hello'));
});

test('murmurhash3_32: different seeds produce different hashes', () => {
  assert.notStrictEqual(
    murmurhash3_32('test', 0),
    murmurhash3_32('test', 1)
  );
});

test('murmurhash3_32: empty string returns valid uint32', () => {
  const h = murmurhash3_32('');
  assert.ok(h >= 0 && h <= 0xFFFFFFFF);
  assert.strictEqual(h, h >>> 0);
});

test('murmurhash3_32: handles multi-block input', () => {
  const long = 'a'.repeat(100);
  const h = murmurhash3_32(long);
  assert.ok(h >= 0 && h <= 0xFFFFFFFF);
  assert.strictEqual(h, murmurhash3_32(long));
});

// ─── XXHash32 ────────────────────────────────────────────────────

test('xxhash32: known empty + seed 0 vector', () => {
  assert.strictEqual(xxhash32('', 0), 0x02CC5D05);
});

test('xxhash32: deterministic', () => {
  assert.strictEqual(xxhash32('test'), xxhash32('test'));
});

test('xxhash32: different seeds produce different hashes', () => {
  assert.notStrictEqual(xxhash32('test', 0), xxhash32('test', 42));
});

test('xxhash32: handles input >= 16 bytes (main loop)', () => {
  const long = 'This is a string longer than 16 bytes!';
  const h = xxhash32(long);
  assert.ok(h >= 0 && h <= 0xFFFFFFFF);
  assert.strictEqual(h, xxhash32(long));
});

test('xxhash32: returns valid uint32 for all sizes', () => {
  for (let len = 0; len <= 20; len++) {
    const s = 'x'.repeat(len);
    const h = xxhash32(s);
    assert.ok(h >= 0 && h <= 0xFFFFFFFF, `bad hash for len=${len}`);
  }
});

// ─── Cross-algorithm ─────────────────────────────────────────────

test('all algorithms produce different hashes for same input', () => {
  const input = 'The quick brown fox';
  const hashes = new Set([
    crc32(input),
    adler32(input),
    djb2(input),
    fnv1a_32(input),
    murmurhash3_32(input),
    xxhash32(input),
  ]);
  // At least 5 out of 6 should be unique
  assert.ok(hashes.size >= 5, `Only ${hashes.size} unique hashes out of 6`);
});

test('avalanche: small input change → different hash', () => {
  for (const fn of [murmurhash3_32, xxhash32, fnv1a_32, djb2]) {
    assert.notStrictEqual(fn('hello'), fn('hellp'), `${fn.name}: hello vs hellp`);
    assert.notStrictEqual(fn('hello'), fn('hello '), `${fn.name}: hello vs hello (space)`);
  }
});

// ─── Uint8Array input ────────────────────────────────────────────

test('Uint8Array input works', () => {
  const u8 = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
  assert.strictEqual(crc32(u8), crc32('hello'));
  assert.strictEqual(murmurhash3_32(u8), murmurhash3_32('hello'));
});

// ─── Utilities ───────────────────────────────────────────────────

test('toHex: 32-bit', () => {
  assert.strictEqual(toHex(0xcbf43926), 'cbf43926');
  assert.strictEqual(toHex(0), '00000000');
  assert.strictEqual(toHex(255), '000000ff');
});

test('toHex: 64-bit bigint', () => {
  assert.strictEqual(toHex(0xcbf29ce484222325n, 64), 'cbf29ce484222325');
  assert.strictEqual(toHex(0n, 64), '0000000000000000');
});

test('combine: produces uint32', () => {
  const c = combine(0x12345678, 0xABCDEF01);
  assert.ok(c >= 0 && c <= 0xFFFFFFFF);
});

// ─── Dispatch function ───────────────────────────────────────────

test('hash() dispatches correctly', () => {
  assert.strictEqual(hash('hello', 'crc32'), crc32('hello'));
  assert.strictEqual(hash('hello', 'fnv1a_32'), fnv1a_32('hello'));
  assert.strictEqual(hash('hello', 'djb2'), djb2('hello'));
  assert.strictEqual(hash('hello', 'murmurhash3_32'), murmurhash3_32('hello'));
  assert.strictEqual(hash('hello', 'xxhash32'), xxhash32('hello'));
  assert.strictEqual(hash('hello', 'murmurhash3_32', 42), murmurhash3_32('hello', 42));
});

test('hash() throws on unknown algorithm', () => {
  assert.throws(() => hash('test', 'nonexistent'), /Unknown algorithm/);
});

test('listAlgorithms returns all names', () => {
  const names = listAlgorithms();
  assert.ok(names.includes('murmurhash3_32'));
  assert.ok(names.includes('xxhash32'));
  assert.ok(names.includes('crc32'));
  assert.ok(names.includes('fnv1a_32'));
  assert.ok(names.includes('fnv1a_64'));
  assert.ok(names.includes('adler32'));
  assert.ok(names.includes('djb2'));
  assert.ok(names.includes('javaHash'));
});

// ─── Distribution sanity ─────────────────────────────────────────

test('distribution: hashes spread across 32-bit range', () => {
  const n = 1000;
  const buckets = new Set();
  for (let i = 0; i < n; i++) {
    buckets.add(murmurhash3_32(`item-${i}`) >>> 16); // top 16 bits
  }
  // At least 900 unique top-16-bits out of 1000 inputs
  assert.ok(buckets.size > 900, `Poor distribution: only ${buckets.size} unique`);
});
