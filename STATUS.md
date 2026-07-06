# hash-x — STATUS.md

**Last audit:** 2026-07-07 (oss-builder)
**Version:** 1.2.0
**Status:** ✅ EXCEPTIONAL — all 13 criteria met

## Exceptional Checklist

- [x] **README hooks reader in first 3 lines** — "Fast non-cryptographic hashing in pure JavaScript. 8 algorithms, zero dependencies, 32-bit and 64-bit output."
- [x] **Quick start works in <2 minutes** — npm install + import, verified functional
- [x] **All tests GREEN (100% pass rate)** — 50/50 pass, 0 failures
- [x] **Test coverage >= 80% on core logic** — 100% statements, 100% branches, 100% functions, 100% lines
- [x] **Zero TypeScript errors** — Pure JS project (ESM), no TS compilation needed
- [x] **Zero ESLint warnings** — Clean (eslint.config.js configured)
- [x] **No TODO/FIXME comments** — Verified via grep across index.js, cli.js, test/
- [x] **At least 3 real-world examples** — Hash map with seed defense, content-addressed cache, distributed partitioning
- [x] **CHANGELOG up to date** — v1.0.0 → v1.1.0 → v1.2.0 documented
- [x] **Modern stack** — Node >=18, ESM modules, zero dependencies
- [x] **Unique value prop clearly stated** — Comparison table vs murmurhash3/xxhash/crc-32/hash.js (8 algos, 0 deps, CLI included)
- [x] **Performance** — All O(n) linear scans, no nested loops, pre-computed CRC table
- [x] **Security** — Input validation (TypeError on invalid types), no secrets, seed NaN rejection in CLI

## Test Summary

| Metric | Value |
|--------|-------|
| Tests | 50 |
| Pass Rate | 100% |
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

## Algorithms

8 non-cryptographic hash functions:
- MurmurHash3 x86 32-bit (seeded)
- XXHash32 (seeded)
- FNV-1a 32-bit
- FNV-1a 64-bit (bigint)
- CRC32 (ISO-HDLC / zlib / PNG)
- Adler-32
- DJB2
- Java String.hashCode() (signed)

## Notes

- Pure JavaScript, zero dependencies
- Supports string, Buffer, Uint8Array, and any ArrayBuffer.isView input
- CLI tool included (`hash-x`) with --seed, --hex, --file, --stdin, --list, demo modes
- POLISH_CHECKLIST.md is a legacy working doc from initial development; this STATUS.md is the canonical audit
