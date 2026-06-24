'use strict';

// ─── VERSION ─────────────────────────────────────────────────────

export const VERSION = '1.2.0';

// ─── Internal helpers ────────────────────────────────────────────

function toBytes(input) {
  if (typeof input === 'string') return Buffer.from(input, 'utf8');
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (ArrayBuffer.isView(input)) {
    return Buffer.from(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
  }
  throw new TypeError('Expected string, Buffer, or Uint8Array');
}

function rotl32(x, r) {
  return ((x << r) | (x >>> (32 - r))) >>> 0;
}

// ─── CRC32 (ISO-HDLC / zlib / PNG) ───────────────────────────────

const _crc32Table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  _crc32Table[n] = c >>> 0;
}

/**
 * CRC32 checksum (zlib/PNG compatible).
 * @param {string|Buffer|Uint8Array} input
 * @returns {number} unsigned 32-bit hash
 */
function crc32(input) {
  const data = toBytes(input);
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = _crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ─── Adler-32 ────────────────────────────────────────────────────

/**
 * Adler-32 checksum.
 * @param {string|Buffer|Uint8Array} input
 * @returns {number} unsigned 32-bit checksum
 */
function adler32(input) {
  const data = toBytes(input);
  let a = 1, b = 0;
  const MOD = 65521;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

// ─── DJB2 ────────────────────────────────────────────────────────

/**
 * DJB2 hash (Bernstein).
 * @param {string|Buffer|Uint8Array} input
 * @returns {number} unsigned 32-bit hash
 */
function djb2(input) {
  const data = toBytes(input);
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = (((hash << 5) + hash) + data[i]) >>> 0;
  }
  return hash;
}

// ─── Java String.hashCode() ──────────────────────────────────────

/**
 * Java's String.hashCode() — polynomial hash with base 31.
 * Returns a signed 32-bit integer (Java semantics).
 * @param {string|Buffer|Uint8Array} input
 * @returns {number} signed 32-bit hash
 */
function javaHash(input) {
  const data = toBytes(input);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (31 * hash + data[i]) | 0;
  }
  return hash;
}

// ─── FNV-1a 32-bit ───────────────────────────────────────────────

/**
 * FNV-1a 32-bit hash.
 * @param {string|Buffer|Uint8Array} input
 * @returns {number} unsigned 32-bit hash
 */
function fnv1a_32(input) {
  const data = toBytes(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// ─── FNV-1a 64-bit ───────────────────────────────────────────────

/**
 * FNV-1a 64-bit hash.
 * @param {string|Buffer|Uint8Array} input
 * @returns {bigint} unsigned 64-bit hash
 */
function fnv1a_64(input) {
  const data = toBytes(input);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xFFFFFFFFFFFFFFFFn;
  for (let i = 0; i < data.length; i++) {
    hash ^= BigInt(data[i]);
    hash = (hash * prime) & mask;
  }
  return hash;
}

// ─── MurmurHash3 x86 32-bit ──────────────────────────────────────

/**
 * MurmurHash3 x86 32-bit.
 * @param {string|Buffer|Uint8Array} input
 * @param {number} seed - 32-bit seed value
 * @returns {number} unsigned 32-bit hash
 */
function murmurhash3_32(input, seed = 0) {
  const data = toBytes(input);
  const len = data.length;
  let h1 = seed >>> 0;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const nblocks = Math.floor(len / 4);

  for (let i = 0; i < nblocks; i++) {
    let k1 = data.readUInt32LE(i * 4);
    k1 = Math.imul(k1, c1);
    k1 = ((k1 << 15) | (k1 >>> 17)) >>> 0;
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = ((h1 << 13) | (h1 >>> 19)) >>> 0;
    h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
  }

  // Tail
  const tail = data.subarray(nblocks * 4);
  let k1 = 0;
  switch (tail.length) {
    case 3: k1 ^= tail[2] << 16;
    case 2: k1 ^= tail[1] << 8;
    case 1:
      k1 ^= tail[0];
      k1 = Math.imul(k1, c1);
      k1 = ((k1 << 15) | (k1 >>> 17)) >>> 0;
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  // Finalization
  h1 ^= len;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

// ─── XXHash32 ────────────────────────────────────────────────────

const XXH_P1 = 2654435761;
const XXH_P2 = 2246822519;
const XXH_P3 = 3266489917;
const XXH_P4 = 668265263;
const XXH_P5 = 374761393;

function _xxh32_round(acc, input) {
  acc = (acc + Math.imul(input, XXH_P2)) >>> 0;
  acc = rotl32(acc, 13);
  acc = Math.imul(acc, XXH_P1) >>> 0;
  return acc;
}

function _xxh32_mergeRound(acc, val) {
  val = _xxh32_round(0, val);
  acc = (acc ^ val) >>> 0;
  acc = (Math.imul(acc, XXH_P1) + XXH_P4) >>> 0;
  return acc;
}

/**
 * XXHash32 (Yann Collet).
 * @param {string|Buffer|Uint8Array} input
 * @param {number} seed - 32-bit seed value
 * @returns {number} unsigned 32-bit hash
 */
function xxhash32(input, seed = 0) {
  const data = toBytes(input);
  const len = data.length;
  let h32;
  let index = 0;

  if (len >= 16) {
    const limit = len - 16;
    let v1 = (seed + XXH_P1 + XXH_P2) >>> 0;
    let v2 = (seed + XXH_P2) >>> 0;
    let v3 = seed >>> 0;
    let v4 = (seed - XXH_P1) >>> 0;

    while (index <= limit) {
      v1 = _xxh32_round(v1, data.readUInt32LE(index)); index += 4;
      v2 = _xxh32_round(v2, data.readUInt32LE(index)); index += 4;
      v3 = _xxh32_round(v3, data.readUInt32LE(index)); index += 4;
      v4 = _xxh32_round(v4, data.readUInt32LE(index)); index += 4;
    }

    h32 = (rotl32(v1, 1) + rotl32(v2, 7) + rotl32(v3, 12) + rotl32(v4, 18)) >>> 0;

    h32 = _xxh32_mergeRound(h32, v1);
    h32 = _xxh32_mergeRound(h32, v2);
    h32 = _xxh32_mergeRound(h32, v3);
    h32 = _xxh32_mergeRound(h32, v4);
  } else {
    h32 = (seed + XXH_P5) >>> 0;
  }

  h32 = (h32 + len) >>> 0;

  while (index <= len - 4) {
    const p = data.readUInt32LE(index);
    h32 = (h32 + Math.imul(p, XXH_P3)) >>> 0;
    h32 = Math.imul(rotl32(h32, 17), XXH_P4) >>> 0;
    index += 4;
  }

  while (index < len) {
    h32 = (h32 + Math.imul(data[index], XXH_P5)) >>> 0;
    h32 = Math.imul(rotl32(h32, 11), XXH_P1) >>> 0;
    index++;
  }

  h32 ^= h32 >>> 15;
  h32 = Math.imul(h32, XXH_P2) >>> 0;
  h32 ^= h32 >>> 13;
  h32 = Math.imul(h32, XXH_P3) >>> 0;
  h32 ^= h32 >>> 16;

  return h32 >>> 0;
}

// ─── Utilities ───────────────────────────────────────────────────

/**
 * Convert a hash value to a zero-padded hex string.
 * @param {number|bigint} hash
 * @param {number} bits - 32 or 64
 * @returns {string} hex string
 */
function toHex(hash, bits = 32) {
  if (typeof hash === 'bigint') {
    return hash.toString(16).padStart(bits / 4, '0');
  }
  return (hash >>> 0).toString(16).padStart(bits / 4, '0');
}

/**
 * Combine two 32-bit hashes into one (simple multiply-add).
 * @param {number} a
 * @param {number} b
 * @returns {number} unsigned 32-bit combined hash
 */
function combine(a, b) {
  return (Math.imul(a >>> 0, 31) + (b >>> 0)) >>> 0;
}

const algorithms = {
  murmurhash3_32,
  fnv1a_32,
  fnv1a_64,
  xxhash32,
  crc32,
  adler32,
  djb2,
  javaHash,
};

/**
 * Dispatch hash by algorithm name.
 * @param {string|Buffer|Uint8Array} input
 * @param {string} algorithm - one of: murmurhash3_32, fnv1a_32, fnv1a_64, xxhash32, crc32, adler32, djb2, javaHash
 * @param {number} seed - seed for seeded algorithms
 * @returns {number|bigint} hash value
 */
function hash(input, algorithm = 'murmurhash3_32', seed = 0) {
  const fn = algorithms[algorithm];
  if (!fn) {
    throw new Error(
      `Unknown algorithm: ${algorithm}. Available: ${Object.keys(algorithms).join(', ')}`
    );
  }
  if (algorithm === 'murmurhash3_32' || algorithm === 'xxhash32') {
    return fn(input, seed);
  }
  return fn(input);
}

/** List all available algorithm names. */
function listAlgorithms() {
  return Object.keys(algorithms);
}

export {
  crc32,
  adler32,
  djb2,
  javaHash,
  fnv1a_32,
  fnv1a_64,
  murmurhash3_32,
  xxhash32,
  toHex,
  combine,
  hash,
  listAlgorithms,
};
