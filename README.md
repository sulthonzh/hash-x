# hash-x

**Fast non-cryptographic hashing in pure JavaScript.** 8 algorithms, zero dependencies, 32-bit and 64-bit output.

When `crypto.createHash('sha256')` is overkill — hash tables, bloom filters, checksums, content-addressed caches need speed, not security.

## Install

```bash
npm install hash-x
```

## Quick Start

```js
import { murmurhash3_32, xxhash32, crc32, toHex } from 'hash-x';

murmurhash3_32('hello world');           // 3428065630
murmurhash3_32('hello world', 42);       // 2853219002 (seeded)

xxhash32('hello world');                 // 1085341092
toHex(xxhash32('test', 42));            // '5ded54ea'

crc32('123456789');                      // 3421780262 (= 0xcbf43926)
```

```bash
# CLI
hash-x murmurhash3_32 "hello world"       # 3428065630
hash-x xxhash32 "test" --seed 42 --hex   # 5ded54ea
hash-x crc32 --file ./data.bin --hex
hash-x --list                            # list all algorithms
hash-x demo                              # demo all algorithms
```

## Algorithms

| Algorithm | Output | Seeded | Best For |
|-----------|--------|--------|----------|
| `murmurhash3_32` | uint32 | ✅ | Hash maps, bloom filters — gold standard for distribution |
| `xxhash32` | uint32 | ✅ | Large inputs — fastest modern hash |
| `fnv1a_32` | uint32 | ❌ | Simple, checksum-grade hashing |
| `fnv1a_64` | bigint | ❌ | 64-bit keys (distributed systems) |
| `crc32` | uint32 | ❌ | Error detection (zlib/PNG compatible) |
| `adler32` | uint32 | ❌ | zlib checksum, fast but weak |
| `djb2` | uint32 | ❌ | Classic, widely compatible |
| `javaHash` | int32 | ❌ | Java `String.hashCode()` compatibility (signed) |

## Comparison

| Feature | hash-x | [murmurhash3] | [xxhash] | [crc-32] | [hash.js] |
|---------|--------|---------------|----------|----------|-----------|
| Algorithms | 8 | 1 | 1 | 1 | ~15 crypto |
| Dependencies | 0 | 0 | 1 | 0 | 0 |
| ESM + CJS | ✅ | ❌ | ❌ | ❌ | ✅ |
| CLI included | ✅ | ❌ | ❌ | ❌ | ❌ |
| 32 + 64-bit | ✅ | 32 only | 32/64 | 32 | varies |
| Seeded hashing | ✅ | ✅ | ✅ | ❌ | ❌ |
| Non-crypto focus | ✅ | ✅ | ✅ | ✅ | ❌ (crypto) |

## Real-World Examples

### 1. Hash Map with Custom Seeding

Avoid hash-flooding attacks by using a random seed per process:

```js
import { murmurhash3_32 } from 'hash-x';

const SEED = Math.floor(Math.random() * 0xFFFFFFFF);

class SafeHashMap {
  #buckets = new Array(1024);
  
  _index(key) {
    return murmurhash3_32(key, SEED) % 1024;
  }
  
  set(key, value) {
    const i = this._index(key);
    (this.#buckets[i] ??= []).push([key, value]);
  }
  
  get(key) {
    const bucket = this.#buckets[this._index(key)];
    return bucket?.find(([k]) => k === key)?.[1];
  }
}
```

### 2. Content-Addressed Cache

Use CRC32 as a quick checksum to detect changes without full diffs:

```js
import { crc32 } from 'hash-x';
import { readFileSync } from 'fs';

function isCacheFresh(filePath, knownChecksum) {
  return crc32(readFileSync(filePath)) === knownChecksum;
}

// Skip rebuild if source hasn't changed
if (isCacheFresh('src/bundle.js', lastChecksum)) {
  console.log('Cache hit — skipping build');
}
```

### 3. Distributed Partitioning

Consistent hashing for sharding with FNV-1a 64-bit:

```js
import { fnv1a_64 } from 'hash-x';

function shardKey(key, numShards) {
  // 64-bit hash → uniform distribution across ring
  const h = fnv1a_64(key);
  return Number(h % BigInt(numShards));
}

// Route requests to the right shard
const shard = shardKey('user:12345', 16); // → 7
```

## CLI

```bash
# Hash a string
hash-x murmurhash3_32 "hello world"

# Hex output
hash-x xxhash32 "test" --hex

# With seed
hash-x murmurhash3_32 "test" --seed 42 --hex

# Hash a file (binary-safe)
hash-x crc32 --file ./data.bin --hex

# Pipe from stdin
echo "hello" | hash-x djb2

# List all algorithms
hash-x --list

# Demo all algorithms
hash-x demo

# Version
hash-x --version
```

## API

All functions accept `string`, `Buffer`, or `Uint8Array` input.

### `murmurhash3_32(input, seed=0)` → `number`
Austin Appleby's MurmurHash3 x86 32-bit. Seeded, excellent avalanche.

### `xxhash32(input, seed=0)` → `number`
Yann Collet's XXHash32. Fastest for inputs > 16 bytes.

### `fnv1a_32(input)` → `number`
Fowler–Noll–Vo 1-a, 32-bit. Simple, decent distribution.

### `fnv1a_64(input)` → `bigint`
FNV-1a 64-bit. Returns `bigint` for full 64-bit precision.

### `crc32(input)` → `number`
ISO-HDLC CRC32 (zlib/PNG compatible).

### `adler32(input)` → `number`
zlib Adler-32 checksum.

### `djb2(input)` → `number`
Bernstein's DJB2. Classic, simple.

### `javaHash(input)` → `number`
Java's `String.hashCode()` — returns **signed** 32-bit integer.

### `hash(input, algorithm, seed=0)` → `number|bigint`
Dispatch by algorithm name. Throws on unknown algorithm.

### `toHex(hash, bits=32)` → `string`
Convert hash to zero-padded hex string. Works with `number` and `bigint`.

### `combine(a, b)` → `number`
Combine two 32-bit hashes (multiply-add fold).

### `listAlgorithms()` → `string[]`
Returns all available algorithm names.

## Test Vectors

```js
crc32('')           === 0             // 0x00000000
crc32('123456789')  === 0xcbf43926    // standard check value
adler32('')          === 1
adler32('Wikipedia') === 0x11E60398
fnv1a_32('')         === 0x811c9dc5   // 2166136261 (FNV offset basis)
fnv1a_32('foobar')   === 0xbf9cf968   // 3214735720
fnv1a_32('a')        === 0xe40c292c
djb2('')             === 5381
xxhash32('', 0)      === 0x02CC5D05   // 46947589
```

## License

MIT
