#!/usr/bin/env node
'use strict';

const { readFileSync } = require('fs');
const {
  crc32, adler32, djb2, javaHash,
  fnv1a_32, fnv1a_64,
  murmurhash3_32, xxhash32,
  toHex, hash, listAlgorithms,
} = require('./index');

const args = process.argv.slice(2);

function usage() {
  console.log(`hash-x — Non-cryptographic hash functions

Usage:
  hash-x <algorithm> <string>    Hash a string
  hash-x <algorithm> --file <path>  Hash a file
  hash-x --list                   List available algorithms
  hash-x demo                     Show demo output

Algorithms:
  ${listAlgorithms().join(', ')}

Options:
  --seed <n>   Seed for seeded algorithms (murmurhash3_32, xxhash32)
  --hex        Output as hex string
  --file <path>  Read input from file instead of string argument

Examples:
  hash-x murmurhash3_32 "hello world"
  hash-x xxhash32 "test" --seed 42 --hex
  hash-x crc32 --file ./data.bin
  hash-x fnv1a_32 "abc" --hex`);
}

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  usage();
  process.exit(0);
}

if (args[0] === '--list') {
  console.log(listAlgorithms().join('\n'));
  process.exit(0);
}

if (args[0] === 'demo') {
  const samples = ['', 'hello', 'hello world', 'The quick brown fox jumps over the lazy dog', '123456789'];
  const algos = listAlgorithms();
  console.log('Algorithm            ' + samples.map(s => `"${s.slice(0,16)}"`).join(' '));
  console.log('-'.repeat(120));
  for (const algo of algos) {
    const vals = samples.map(s => {
      const v = hash(s, algo);
      return typeof v === 'bigint' ? toHex(v, 64).slice(0, 16) : toHex(v, 32);
    });
    console.log(`${algo.padEnd(20)} ${vals.join(' ')}`);
  }
  process.exit(0);
}

// Parse arguments
const algo = args[0];
let input = null;
let seed = 0;
let asHex = false;
let filePath = null;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--seed') {
    seed = parseInt(args[++i], 10) || 0;
  } else if (args[i] === '--hex') {
    asHex = true;
  } else if (args[i] === '--file') {
    filePath = args[++i];
  } else if (args[i] && !input) {
    input = args[i];
  }
}

if (!listAlgorithms().includes(algo)) {
  console.error(`Unknown algorithm: ${algo}`);
  console.error(`Available: ${listAlgorithms().join(', ')}`);
  process.exit(1);
}

let data;
if (filePath) {
  data = readFileSync(filePath);
} else if (input !== null) {
  data = input;
} else {
  // Read from stdin
  const chunks = [];
  try {
    while (true) {
      const chunk = require('fs').readFileSync(0, 'utf8');
      chunks.push(chunk);
    }
  } catch {
    // EOF
  }
  data = chunks.join('');
}

const result = hash(data, algo, seed);
if (typeof result === 'bigint') {
  console.log(asHex ? toHex(result, 64) : result.toString());
} else {
  console.log(asHex ? toHex(result, 32) : (result >>> 0));
}
