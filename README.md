# AgentLint

[![npm version](https://img.shields.io/npm/v/@alexmelges/agentlint)](https://www.npmjs.com/package/@alexmelges/agentlint)
[![license](https://img.shields.io/npm/l/@alexmelges/agentlint)](https://github.com/alexmelges/agentlint/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@alexmelges/agentlint)](https://nodejs.org)

**Production-readiness checker for agent-generated code.** Catches the patterns that coding agents (Claude Code, Codex, Cursor, Copilot) consistently produce but shouldn't ship.

**Not a style linter.** ESLint handles formatting. AgentLint catches agent-specific code smells — hardcoded paths, missing error handling, leaked credentials, naive patterns.

## Quick Start

```bash
npx @alexmelges/agentlint .
```

### Scan a git diff (CI-friendly)

```bash
git diff main | npx @alexmelges/agentlint --stdin
```

### JSON output for CI/CD

```bash
npx @alexmelges/agentlint . --json --errors-only
```

Exit code `1` if any errors found, `0` otherwise.

## Real-World Examples

### Catching hardcoded paths agents love to leave behind

```
src/config.ts
  12:1  ✗ error  Hardcoded path "/Users/john/projects/myapp/data.json"  no-hardcoded-paths
```

### Spotting leaked credentials in generated code

```
src/api.ts
  5:1  ✗ error  Possible hardcoded credential: password = "..."  no-credential-leak
```

### Finding async functions without error handling

```
src/handlers/webhook.ts
  42:1  ⚠ warning  Async function "processWebhook" has no try/catch  no-unhandled-async
```

### Flagging fetch calls without timeout

```
src/client.ts
  18:1  ⚠ warning  fetch() call without AbortSignal/timeout  no-timeout
```

## Configuration

Create `.agentlintrc.json` in your project root, or pass `--config <path>`:

```json
{
  "rules": {
    "no-console-log": "off",
    "no-magic-numbers": "error",
    "no-todo-fixme": "warning"
  },
  "ignore": ["generated/", "migrations/"],
  "extensions": [".ts", ".js", ".tsx", ".jsx"]
}
```

### Rule severities

- `"error"` — exit code 1 (block CI)
- `"warning"` — reported but doesn't fail
- `"info"` — informational only
- `"off"` — rule disabled

### CLI options

```bash
agentlint [path]                  # Scan directory or file
agentlint . --json                # JSON output
agentlint . --errors-only         # Only errors (skip warnings/info)
agentlint . --config custom.json  # Custom config file
git diff | agentlint --stdin      # Lint a diff
```

## Rules (14)

| Rule | Severity | What it catches |
|------|----------|----------------|
| `no-hardcoded-paths` | error | `/Users/john/...`, `/home/deploy/...` |
| `no-hardcoded-urls` | warning | `http://localhost:3000`, hardcoded ports |
| `no-unhandled-async` | warning | `async` without `try/catch`, `.then()` without `.catch()` |
| `no-credential-leak` | error | Hardcoded passwords, API keys, tokens |
| `no-console-log` | warning | `console.log` instead of structured logging |
| `no-unbounded-query` | warning | `.find({})`, `SELECT *` without LIMIT |
| `no-input-validation` | warning | HTTP handlers without input validation |
| `no-retry-logic` | info | `fetch()` without retry/backoff |
| `no-todo-fixme` | info | TODO/FIXME/HACK comments |
| `no-sync-fs` | warning | `readFileSync` and friends |
| `no-magic-numbers` | info | Unexplained numeric literals |
| `no-empty-catch` | error | `catch (e) {}` that swallows errors |
| `no-any-type` | warning | TypeScript `any` type usage |
| `no-timeout` | warning | `fetch()` without timeout/AbortSignal |

## CI Integration

### GitHub Actions

```yaml
- name: AgentLint
  run: npx @alexmelges/agentlint . --errors-only
```

### Git diff only (PRs)

```yaml
- name: AgentLint (changed files)
  run: git diff origin/main | npx @alexmelges/agentlint --stdin --errors-only
```

## Why not ESLint?

ESLint catches **style** issues. AgentLint catches **production-readiness** issues specific to AI-generated code:

- ESLint won't flag `/Users/john/data.json` as a hardcoded path
- ESLint won't detect that your Express handler has no input validation
- ESLint won't notice your `fetch()` has no timeout or retry logic
- ESLint won't catch `password = "hunter2"` as a credential leak
- Secret scanners (gitleaks, trufflehog) only cover secrets, not architectural issues

AgentLint fills the gap between linting and code review.

## Programmatic API

```typescript
import { lintFiles, formatJSON } from '@alexmelges/agentlint';

const result = await lintFiles('./src');
console.log(formatJSON(result));
```

### With config

```typescript
import { lintFiles } from '@alexmelges/agentlint';

const result = await lintFiles('./src', {
  rules: { 'no-console-log': 'off' },
  ignore: ['test/'],
});
```

## License

MIT
