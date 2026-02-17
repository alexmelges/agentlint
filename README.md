# AgentLint

Production-readiness checker for agent-generated code. Catches the patterns that coding agents (Claude Code, Codex, Cursor, Copilot) consistently produce but shouldn't ship.

**Not a style linter.** ESLint handles formatting. AgentLint catches agent-specific code smells — hardcoded paths, missing error handling, leaked credentials, naive patterns.

## Quick Start

```bash
npx agentlint .
```

### Scan a git diff (CI-friendly)

```bash
git diff main | npx agentlint --stdin
```

### JSON output for CI/CD

```bash
npx agentlint . --json --errors-only
```

Exit code `1` if any errors found, `0` otherwise.

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
import { lintFiles, formatJSON } from 'agentlint';

const result = await lintFiles('./src');
console.log(formatJSON(result));
```

## License

MIT
