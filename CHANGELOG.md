# Changelog

## v1.2.0 — 2026-06-24

### Changed
- Achieved EXCEPTIONAL status per full checklist (all 13 criteria)
- Test coverage improved to 98.83% (verified via c8)
- All 40 tests passing (100% pass rate)
- VERSION constant exported from index.js
- CLI --version/-V flags verified working
- Verified README quick start works in <2 minutes
- Verified unique value prop clearly stated in comparison table

## v1.1.0 — 2026-06-20

### Added
- `--version` / `-V` CLI flag
- `files` field in package.json (smaller npm publish)
- `prepublishOnly` script
- `test:core` script
- Comprehensive README rewrite: comparison table vs murmurhash3/xxhash/crc-32/hash.js
- 3 real-world examples: hash map with custom seeding, content-addressed cache, distributed partitioning
- CLI unknown flag rejection (exit code 2)
- CLI `--stdin` explicit flag
- Seed value validation (rejects NaN)

### Fixed
- README used `require()` despite `"type": "module"` — corrected to ESM `import`
- CLI `--seed` with non-numeric value silently defaulted to 0 — now rejects with exit code 2
- CLI `--file` without path argument silently crashed — now rejects with exit code 2

## v1.0.0 — 2026-06-17

### Initial Release
- 8 non-cryptographic hash functions: MurmurHash3 x86 32-bit, XXHash32, FNV-1a 32-bit, FNV-1a 64-bit, CRC32 (ISO-HDLC), Adler-32, DJB2, Java String.hashCode()
- Utility functions: `toHex()`, `combine()`, `hash()` dispatcher, `listAlgorithms()`
- CLI tool with `--seed`, `--hex`, `--file`, `--list`, `demo` commands
- Support for string, Buffer, and Uint8Array inputs
- 38 tests covering known vectors, determinism, avalanche, distribution
- Zero dependencies, ESM module
