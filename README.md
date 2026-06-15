# hash-x

Fast non-cryptographic hash functions with zero dependencies.

## Why?

Non-cryptographic hashes are the workhorses of hash tables, bloom filters, checksums, and content-addressed systems. You don't need `crypto.createHash('sha256')` for every job — sometimes you just need a fast, well-distributed 32-bit integer.

`hash-x` bundles the most useful non-cryptographic hash functions into one zero-dependency package with a clean API.

## Install

```bash
npm install hash-x
```

## Algorithms

| Algorithm | Output | Seeded | Notes |
|-----------|--------|--------|-------|
| `murmurhash3_32` | uint32 | ✅ | Austin Appleby's MurmurHash3 x86 32-bit. Excellent distribution, the standard for hash maps. |
| `xxhash32` | uint32 | ✅ | Yann Collet's XXHash32. Extremely fast for large inputs. |
| `fnv1a_32` | uint32 | ❌ | Fowler–Noll–Vo 1a. Simple, decent distribution. |
| `fnv1a_64` | bigint | ❌ | 64-bit FNV-1a. |
| `crc32` | uint32 | ❌ | ISO-HDLC (zlib/PNG compatible). Error detection, not hash maps. |
| `adler32` | uint32 | ❌ | zlib checksum. Fast but weak distribution. |
| `djb2` | uint32 | ❌ | Bernstein's classic. Simple, widely used. |
| `javaHash` | int32 | ❌ | Java's `String.hashCode()`. Signed 32-bit. |

## Usage

```js
const { murmurhash3_32, xxhash32, fnv1a_32, crc32, toHex } = require('hash-x');

// Individual functions
murmurhash3_32('hello world');          // 3428065630
murmurhash3_32('hello world', 42);      // 2853219002 (with seed)

xxhash32('hello world');                // 1085341092
xxhash32('hello world', 1234);          // 4000701488

fnv1a_32('foobar');                     // 3214735720
crc32('123456789');                     // 3421780262 (= 0xcbf43926)

// Convert to hex
toHex(murmurhash3_32('test'));          // '0c8756d0'

// Dispatch by name
const { hash } = require('hash-x');
hash('test', 'djb2');                   // 2090756997

// Works with Buffers too (great for file hashing)
const { readFileSync } = require('fs');
crc32(readFileSync('data.bin'));
```

## CLI

```bash
# Hash a string
hash-x murmurhash3_32 "hello world"
# 3428065630

# Hex output
hash-x xxhash32 "test" --hex
# 5ded54ea

# With seed
hash-x murmurhash3_32 "test" --seed 42 --hex
# 10dada77

# Hash a file
hash-x crc32 --file ./package.json --hex

# List algorithms
hash-x --list

# Demo all algorithms
hash-x demo
```

## API

### `murmurhash3_32(input, seed=0)` → `number`
### `xxhash32(input, seed=0)` → `number`
### `fnv1a_32(input)` → `number`
### `fnv1a_64(input)` → `bigint`
### `crc32(input)` → `number`
### `adler32(input)` → `number`
### `djb2(input)` → `number`
### `javaHash(input)` → `number` (signed)

All accept `string`, `Buffer`, or `Uint8Array` input.

### `hash(input, algorithm, seed=0)` → `number|bigint`
Dispatch by algorithm name.

### `toHex(hash, bits=32)` → `string`
Convert a hash to zero-padded hex string.

### `combine(a, b)` → `number`
Combine two 32-bit hashes.

### `listAlgorithms()` → `string[]`

## Test Vectors

```js
crc32('')         === 0          // 0x00000000
crc32('123456789') === 0xcbf43926 // standard check value
adler32('')        === 1
adler32('Wikipedia') === 0x11E60398
fnv1a_32('')       === 0x811c9dc5 // 2166136261 (FNV offset basis)
fnv1a_32('foobar') === 0xbf9cf968 // 3214735720
djb2('')           === 5381
xxhash32('', 0)    === 0x02CC5D05 // 46947589
```

## License

MIT
