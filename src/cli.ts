#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { lintFiles, lintStdin } from './engine.js';
import { applyFixes } from './fixer.js';
import { formatHuman, formatJSON, formatSARIF } from './formatter.js';
import type { LintConfig } from './types.js';

/** Number of built-in lint rules. */
const RULE_COUNT = 31;

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    // eslint-disable-next-line no-console
    console.log('agentlint 0.7.0');
    process.exit(0);
  }

  const isStdin = args.includes('--stdin');
  const isJSON = args.includes('--json');
  const isSARIF = args.includes('--sarif');
  const errorsOnly = args.includes('--errors-only');
  const isFix = args.includes('--fix');

  // Load config from --config flag or default .agentlintrc.json
  const config = await loadConfig(args);

  if (isStdin) {
    const input = await readStdin();
    const result = await lintStdin(input, config);
    if (errorsOnly) {
      result.violations = result.violations.filter((v) => v.severity === 'error');
    }
    // eslint-disable-next-line no-console
    console.log(isSARIF ? formatSARIF(result) : isJSON ? formatJSON(result) : formatHuman(result));
    process.exit(result.violations.some((v) => v.severity === 'error') ? 1 : 0);
  }

  const target = args.find((a) => !a.startsWith('-') && args.indexOf(a) !== args.indexOf('--config') + 1) ?? '.';
  const resolved = path.resolve(target);

  if (isFix) {
    const fixResult = await applyFixes(resolved, config);
    // eslint-disable-next-line no-console
    console.log(fixResult);
    process.exit(0);
  }

  const result = await lintFiles(resolved, config);

  if (errorsOnly) {
    result.violations = result.violations.filter((v) => v.severity === 'error');
  }

  // eslint-disable-next-line no-console
  console.log(isSARIF ? formatSARIF(result) : isJSON ? formatJSON(result) : formatHuman(result));
  process.exit(result.violations.some((v) => v.severity === 'error') ? 1 : 0);
}

/** Load config from --config path or auto-discover .agentlintrc.json */
async function loadConfig(args: string[]): Promise<LintConfig> {
  const configIdx = args.indexOf('--config');
  const configPath = configIdx !== -1 && args[configIdx + 1]
    ? path.resolve(args[configIdx + 1])
    : path.resolve('.agentlintrc.json');

  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as LintConfig;
    return parsed;
  } catch {
    // No config file found or invalid — use defaults
    if (configIdx !== -1) {
      // Explicit --config was provided but failed
      console.error(`Warning: could not load config from ${configPath}`); // eslint-disable-line no-console
    }
    return {};
  }
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
  // eslint-disable-next-line no-console
  console.log(`
agentlint — Production-readiness checker for agent-generated code

Usage:
  agentlint [path]                  Scan a directory or file
  git diff | agentlint --stdin      Lint a git diff
  agentlint . --json                Output JSON format
  agentlint . --sarif               Output SARIF 2.1.0 (GitHub Security tab)
  agentlint . --errors-only         Only show errors
  agentlint . --fix                 Auto-fix supported violations in-place
  agentlint . --config custom.json  Use custom config file

Options:
  --stdin        Read from stdin (expects unified diff format)
  --json         Output JSON instead of human-readable format
  --sarif        Output SARIF 2.1.0 for GitHub Security tab
  --errors-only  Only report errors (skip warnings and info)
  --fix          Auto-fix supported violations (console-log, todo-fixme, empty-catch, any-type)
  --config <path>  Path to config file (default: .agentlintrc.json)
  -h, --help     Show this help message
  -v, --version  Show version

Config file (.agentlintrc.json):
  {
    "rules": {
      "no-console-log": "off",       // Disable a rule
      "no-magic-numbers": "error",   // Upgrade severity
      "no-todo-fixme": "warning"     // Change severity
    },
    "ignore": ["generated/"],        // Extra dirs to ignore
    "extensions": [".ts", ".js"]     // File extensions to scan
  }

Rules (${RULE_COUNT}):
  no-hardcoded-paths    Hardcoded file system paths
  no-hardcoded-urls     Hardcoded localhost URLs and ports
  no-unhandled-async    Async without try/catch or .catch()
  no-credential-leak    Hardcoded credentials and API keys
  no-console-log        console.log instead of structured logging          [fixable]
  no-unbounded-query    Database queries without pagination
  no-input-validation   HTTP handlers without input validation
  no-retry-logic        HTTP calls without retry/backoff
  no-todo-fixme         TODO/FIXME comments left by agents                 [fixable]
  no-sync-fs            Synchronous file system operations
  no-magic-numbers      Magic numbers without named constants
  no-empty-catch        Empty catch blocks that swallow errors             [fixable]
  no-any-type           Usage of \`any\` type in TypeScript                  [fixable]
  no-timeout            Network calls without timeout
  unsafe-eval           eval(), new Function(), setTimeout with string
  unbounded-loop        while(true)/for(;;) without break
  missing-types         TS functions without return type annotations
  sql-injection         SQL queries built via string concat/template
  overly-permissive     Wildcard CORS, chmod 777, TLS disabled
  resource-leak         Streams/connections without close

  Go rules:
  go-error-ignored      Ignoring error return values with _ or unchecked
  go-defer-in-loop      defer inside for loops (resource leak)
  go-goroutine-leak     Goroutines without sync/context cancellation
  go-nil-check-missing  Pointer dereference without nil check after err
  go-bare-return        Naked return in functions with named returns
  go-init-function      init() functions (hidden initialization)

  Rust rules:
  rust-unwrap           .unwrap() calls outside of tests
  rust-unsafe-block     unsafe blocks without SAFETY comments
  rust-clone-heavy      Excessive .clone() calls (AI over-clones)
  rust-todo-macro       todo!() and unimplemented!() macros left in code
  rust-panic            panic!() in library code (non-main, non-test)
`);
}

main().catch((err) => {
  console.error('agentlint error:', err.message); // eslint-disable-line no-console
  process.exit(2);
});
