# hash-x — Exceptional Checklist Audit

**Last audit:** 2026-08-01 (re-audited from 2026-07-23)
**Version:** 1.2.0
**Status:** ✅ EXCEPTIONAL — all 13 criteria met

## Exceptional Checklist

- [x] **README hooks reader in first 3 lines** — "Fast non-cryptographic hashing in pure JavaScript. 8 algorithms, zero dependencies, 32-bit and 64-bit output."
- [x] **Quick start works in <2 minutes** — npm install + import, verified functional
- [x] **All tests GREEN (100% pass rate)** — 74/74 tests pass (50 core + 24 CLI)
- [x] **Test coverage >= 80% on core logic** — **100% statements, 100% branches, 100% functions, 100% lines** across ALL files (index.js + cli.js)
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
| Core tests | 50/50 pass (100%) |
| CLI integration tests | 24/24 pass (100%) |
| Total tests | 74/74 pass (100%) |
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

## Coverage Detail

```
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |                   
 cli.js   |     100 |      100 |     100 |     100 |                   
 index.js |     100 |      100 |     100 |     100 |                   
```

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

## Re-Audit History

### 2026-08-01 Re-Audit (CLI stdin coverage → 100% all metrics)

**Action:** Re-audited hash-x (STATUS.md 9 days stale from 2026-07-23, cli.js at 92.18% stmts / 95.55% branches with lines 91-92 and 114-121 uncovered — stdin reading paths).

**Issue resolved:** Prior audit noted "CLI test runner hangs (known ESM + execFileSync interaction)" preventing 18 CLI tests from running in automated suite. Verified this issue is now resolved — all CLI tests run successfully (~9s execution time). The `test` and `test:coverage` scripts already include both test files.

**New tests:** +6 in `test/cli.test.js` targeting stdin reading paths (lines 91-92 `--stdin` flag handler, lines 114-121 stdin reading loop):
- `--stdin` flag reads from stdin (pipes 'hello', verifies crc32=907060870 — covers line 90-92 `--stdin` branch + lines 114-121 stdin else branch)
- No args + piped stdin reads from stdin (no --stdin flag, no input string, no --file → falls to stdin reader — covers lines 114-121)
- `--stdin` with `--hex` outputs hex (crc32('hello') = 3610a686)
- `--stdin` with 64-bit algorithm (fnv1a_64 via stdin)
- `--stdin` with seeded algorithm (murmurhash3_32 with different seeds via stdin)
- `--stdin` empty input produces valid hash (crc32('') = 0)

**Coverage:** cli.js 92.18%→**100%** stmts, 95.55%→**100%** branches. Overall: **100% all metrics across all files** ✅.

**Tests:** 68 → **74** (+6), all GREEN ✅.

### 2026-07-23 Re-Audit (CLI test script fix)

**Gap identified and fixed:** CLI integration tests (18 tests) added on 2026-07-17 via commit ed41add but not included in `package.json` test script. Only core tests (50) were being executed.

**Fix applied:** Updated `package.json`:
- `test` script now includes both `test/index.test.js` and `test/cli.test.js`
- `test:coverage` now measures coverage for both test suites
- `test:core` preserved for backward compatibility

**Note:** CLI tests were known to hang due to ESM + execFileSync interaction. Verified in 2026-08-01 re-audit that this issue is resolved (likely Node.js version fix). All 24 CLI tests now run in ~9 seconds.

### 2026-07-17 Initial Audit

- 50 core tests, 100% coverage on index.js
- 18 CLI integration tests added (commit ed41add)
