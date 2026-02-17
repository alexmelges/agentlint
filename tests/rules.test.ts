import { describe, it, expect } from 'vitest';
import { hardcodedPaths } from '../src/rules/hardcoded-paths.js';
import { hardcodedUrls } from '../src/rules/hardcoded-urls.js';
import { missingErrorHandling } from '../src/rules/missing-error-handling.js';
import { credentialLeak } from '../src/rules/credential-leak.js';
import { consoleLog } from '../src/rules/console-log.js';
import { noPagination } from '../src/rules/no-pagination.js';
import { noInputValidation } from '../src/rules/no-input-validation.js';
import { noRetry } from '../src/rules/no-retry.js';
import { todoFixme } from '../src/rules/todo-fixme.js';
import { syncFs } from '../src/rules/sync-fs.js';
import { magicNumbers } from '../src/rules/magic-numbers.js';
import { emptyCatch } from '../src/rules/empty-catch.js';
import { anyType } from '../src/rules/any-type.js';
import { noTimeout } from '../src/rules/no-timeout.js';

function check(rule: any, content: string, file = 'test.ts') {
  return rule.check(file, content, content.split('\n'));
}

describe('no-hardcoded-paths', () => {
  it('detects macOS user paths', () => {
    const v = check(hardcodedPaths, 'const p = "/Users/john/data.json";');
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain('macOS');
  });
  it('detects Linux home paths', () => {
    const v = check(hardcodedPaths, 'const p = "/home/deploy/app";');
    expect(v).toHaveLength(1);
  });
  it('ignores comments', () => {
    const v = check(hardcodedPaths, '// /Users/john/data.json');
    expect(v).toHaveLength(0);
  });
  it('passes clean code', () => {
    const v = check(hardcodedPaths, 'const p = process.env.DATA_PATH;');
    expect(v).toHaveLength(0);
  });
});

describe('no-hardcoded-urls', () => {
  it('detects localhost URLs', () => {
    const v = check(hardcodedUrls, 'const url = "http://localhost:3000/api";');
    expect(v.length).toBeGreaterThanOrEqual(1);
  });
  it('detects 127.0.0.1', () => {
    const v = check(hardcodedUrls, 'fetch("http://127.0.0.1:8080/health")');
    expect(v.length).toBeGreaterThanOrEqual(1);
  });
  it('skips test files', () => {
    const v = check(hardcodedUrls, 'const url = "http://localhost:3000";', 'api.test.ts');
    expect(v).toHaveLength(0);
  });
});

describe('no-unhandled-async', () => {
  it('detects async without try/catch', () => {
    const code = `async function fetchData() {
  const res = await fetch('https://api.example.com/data');
  return res.json();
}`;
    const v = check(missingErrorHandling, code);
    expect(v.length).toBeGreaterThanOrEqual(1);
  });
  it('passes with try/catch', () => {
    const code = `async function fetchData() {
  try {
    const res = await fetch('https://api.example.com/data');
    return res.json();
  } catch (e) { throw e; }
}`;
    const v = check(missingErrorHandling, code);
    const asyncV = v.filter(v => v.rule === 'no-unhandled-async');
    expect(asyncV).toHaveLength(0);
  });
  it('detects .then without .catch', () => {
    const v = check(missingErrorHandling, 'promise.then(data => console.log(data));');
    expect(v).toHaveLength(1);
  });
});

describe('no-credential-leak', () => {
  it('detects hardcoded password', () => {
    const v = check(credentialLeak, 'const password = "supersecret123";');
    expect(v).toHaveLength(1);
  });
  it('detects API keys', () => {
    const v = check(credentialLeak, 'const apiKey = "sk_live_abcdefghij1234567890";');
    expect(v.length).toBeGreaterThanOrEqual(1);
  });
  it('ignores env var references', () => {
    const v = check(credentialLeak, 'const token = process.env.API_TOKEN;');
    expect(v).toHaveLength(0);
  });
  it('detects GitHub tokens', () => {
    const v = check(credentialLeak, 'const t = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";');
    expect(v).toHaveLength(1);
  });
});

describe('no-console-log', () => {
  it('detects console.log', () => {
    const v = check(consoleLog, 'console.log("debug");');
    expect(v).toHaveLength(1);
  });
  it('detects console.error', () => {
    const v = check(consoleLog, 'console.error("fail");');
    expect(v).toHaveLength(1);
  });
  it('skips test files', () => {
    const v = check(consoleLog, 'console.log("ok");', 'app.test.ts');
    expect(v).toHaveLength(0);
  });
});

describe('no-unbounded-query', () => {
  it('detects empty find', () => {
    const v = check(noPagination, 'const all = await db.find({})');
    expect(v).toHaveLength(1);
  });
  it('detects SELECT * without LIMIT', () => {
    const v = check(noPagination, 'const q = "SELECT * FROM users"');
    expect(v).toHaveLength(1);
  });
});

describe('no-input-validation', () => {
  it('detects route without validation', () => {
    const code = `app.post('/users', async (req, res) => {
  const user = await db.create(req.body);
  res.json(user);
});`;
    const v = check(noInputValidation, code);
    expect(v.length).toBeGreaterThanOrEqual(1);
  });
  it('passes with zod validation', () => {
    const code = `app.post('/users', async (req, res) => {
  const data = schema.safeParse(req.body);
  if (!data.success) return res.status(400).json(data.error);
  res.json(data.data);
});`;
    const v = check(noInputValidation, code);
    expect(v).toHaveLength(0);
  });
});

describe('no-retry-logic', () => {
  it('detects fetch without retry', () => {
    const v = check(noRetry, 'const res = await fetch(url);');
    expect(v).toHaveLength(1);
  });
  it('passes when retry exists', () => {
    const code = `const maxRetries = 3;\nconst res = await fetch(url);`;
    const v = check(noRetry, code);
    expect(v).toHaveLength(0);
  });
});

describe('no-todo-fixme', () => {
  it('detects TODO', () => {
    const v = check(todoFixme, '// TODO: fix this later');
    expect(v).toHaveLength(1);
  });
  it('detects FIXME', () => {
    const v = check(todoFixme, '// FIXME: broken');
    expect(v).toHaveLength(1);
  });
});

describe('no-sync-fs', () => {
  it('detects readFileSync', () => {
    const v = check(syncFs, 'const data = readFileSync("file.txt");', 'app.ts');
    expect(v).toHaveLength(1);
  });
  it('allows sync in CLI files', () => {
    const v = check(syncFs, 'const data = readFileSync("file.txt");', 'cli.ts');
    expect(v).toHaveLength(0);
  });
});

describe('no-empty-catch', () => {
  it('detects empty catch', () => {
    const v = check(emptyCatch, 'try { x() } catch (e) {}');
    expect(v).toHaveLength(1);
  });
  it('passes with catch body', () => {
    const v = check(emptyCatch, 'try { x() } catch (e) { console.error(e) }');
    expect(v).toHaveLength(0);
  });
});

describe('no-any-type', () => {
  it('detects : any', () => {
    const v = check(anyType, 'function f(x: any) {}');
    expect(v).toHaveLength(1);
  });
  it('detects as any', () => {
    const v = check(anyType, 'const x = foo as any;');
    expect(v).toHaveLength(1);
  });
});

describe('no-timeout', () => {
  it('detects fetch without timeout', () => {
    const v = check(noTimeout, 'const res = await fetch(url);');
    expect(v).toHaveLength(1);
  });
  it('passes with AbortSignal', () => {
    const v = check(noTimeout, 'const signal = AbortSignal.timeout(5000);\nfetch(url, { signal });');
    expect(v).toHaveLength(0);
  });
});

describe('no-magic-numbers', () => {
  it('detects magic numbers', () => {
    const v = check(magicNumbers, 'if (retries > 37) return;');
    expect(v).toHaveLength(1);
  });
  it('allows common HTTP status codes', () => {
    const v = check(magicNumbers, 'if (status === 200) return;');
    expect(v).toHaveLength(0);
  });
});
