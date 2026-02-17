#!/usr/bin/env node

import * as path from 'node:path';
import { lintFiles, lintStdin } from './engine.js';
import { formatHuman, formatJSON } from './formatter.js';
import type { LintConfig } from './types.js';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('agentlint 0.1.0');
    process.exit(0);
  }

  const isStdin = args.includes('--stdin');
  const isJSON = args.includes('--json');
  const errorsOnly = args.includes('--errors-only');

  // Parse config overrides
  const config: LintConfig = {};

  if (isStdin) {
    const input = await readStdin();
    const result = await lintStdin(input, config);
    if (errorsOnly) {
      result.violations = result.violations.filter((v) => v.severity === 'error');
    }
    console.log(isJSON ? formatJSON(result) : formatHuman(result));
    process.exit(result.violations.some((v) => v.severity === 'error') ? 1 : 0);
  }

  const target = args.find((a) => !a.startsWith('-')) ?? '.';
  const resolved = path.resolve(target);
  const result = await lintFiles(resolved, config);

  if (errorsOnly) {
    result.violations = result.violations.filter((v) => v.severity === 'error');
  }

  console.log(isJSON ? formatJSON(result) : formatHuman(result));
  process.exit(result.violations.some((v) => v.severity === 'error') ? 1 : 0);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function printHelp(): void {
  console.log(`
agentlint — Production-readiness checker for agent-generated code

Usage:
  agentlint [path]           Scan a directory or file
  git diff | agentlint --stdin   Lint a git diff
  agentlint . --json         Output JSON format
  agentlint . --errors-only  Only show errors

Options:
  --stdin        Read from stdin (expects unified diff format)
  --json         Output JSON instead of human-readable format
  --errors-only  Only report errors (skip warnings and info)
  -h, --help     Show this help message
  -v, --version  Show version

Rules (14):
  no-hardcoded-paths    Hardcoded file system paths
  no-hardcoded-urls     Hardcoded localhost URLs and ports
  no-unhandled-async    Async without try/catch or .catch()
  no-credential-leak    Hardcoded credentials and API keys
  no-console-log        console.log instead of structured logging
  no-unbounded-query    Database queries without pagination
  no-input-validation   HTTP handlers without input validation
  no-retry-logic        HTTP calls without retry/backoff
  no-todo-fixme         TODO/FIXME comments left by agents
  no-sync-fs            Synchronous file system operations
  no-magic-numbers      Magic numbers without named constants
  no-empty-catch        Empty catch blocks that swallow errors
  no-any-type           Usage of \`any\` type in TypeScript
  no-timeout            Network calls without timeout
`);
}

main().catch((err) => {
  console.error('agentlint error:', err.message);
  process.exit(2);
});
