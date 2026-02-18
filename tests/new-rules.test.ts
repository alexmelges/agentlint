import { describe, expect, it } from 'vitest';
import { unsafeEval } from '../src/rules/unsafe-eval.js';
import { unboundedLoop } from '../src/rules/unbounded-loop.js';
import { missingTypes } from '../src/rules/missing-types.js';
import { sqlInjection } from '../src/rules/sql-injection.js';
import { overlyPermissive } from '../src/rules/overly-permissive.js';
import { resourceLeak } from '../src/rules/resource-leak.js';

describe('unsafe-eval', () => {
  it('detects eval()', () => {
    const code = 'const result = eval(userInput);';
    const v = unsafeEval.check('app.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('unsafe-eval');
  });

  it('detects new Function()', () => {
    const code = 'const fn = new Function("return " + expr);';
    const v = unsafeEval.check('app.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('detects setTimeout with string arg', () => {
    const code = 'setTimeout("alert(1)", 1000);';
    const v = unsafeEval.check('app.js', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('passes for normal setTimeout with function', () => {
    const code = 'setTimeout(() => doStuff(), 1000);';
    const v = unsafeEval.check('app.ts', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = 'eval("test");';
    const v = unsafeEval.check('app.test.ts', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });
});

describe('unbounded-loop', () => {
  it('detects while(true) without break', () => {
    const code = 'while (true) {\n  console.log("forever");\n}';
    const v = unboundedLoop.check('server.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('passes while(true) with break', () => {
    const code = 'while (true) {\n  if (done) break;\n  process();\n}';
    const v = unboundedLoop.check('server.ts', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });

  it('detects for(;;) without exit', () => {
    const code = 'for (;;) {\n  doStuff();\n}';
    const v = unboundedLoop.check('worker.js', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('detects Python while True', () => {
    const code = 'while True:\n    process()\n    sleep(1)';
    const v = unboundedLoop.check('worker.py', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('missing-types', () => {
  it('detects function without return type', () => {
    const code = 'export function processData(input: string) {\n  return input;\n}';
    const v = missingTypes.check('util.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].message).toContain('processData');
  });

  it('passes function with return type', () => {
    const code = 'export function processData(input: string): string {\n  return input;\n}';
    const v = missingTypes.check('util.ts', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });

  it('skips non-TS files', () => {
    const code = 'function foo() { return 1; }';
    const v = missingTypes.check('util.js', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = 'function helper() { return 1; }';
    const v = missingTypes.check('util.test.ts', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });
});

describe('sql-injection', () => {
  it('detects template literal SQL', () => {
    const code = 'const query = `SELECT * FROM users WHERE id = ${userId}`;';
    const v = sqlInjection.check('db.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('sql-injection');
  });

  it('detects string concatenation SQL', () => {
    const code = 'const q = "SELECT * FROM users WHERE name = " + name;';
    const v = sqlInjection.check('db.js', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('detects Python f-string SQL', () => {
    const code = 'query = f"SELECT * FROM users WHERE id = {user_id}"';
    const v = sqlInjection.check('db.py', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('passes parameterized queries', () => {
    const code = 'db.prepare("SELECT * FROM users WHERE id = ?").get(userId);';
    const v = sqlInjection.check('db.ts', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });
});

describe('overly-permissive', () => {
  it('detects wildcard CORS with context', () => {
    const code = 'const corsOptions = {\n  origin: "*"\n};';
    const v = overlyPermissive.check('server.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('detects chmod 777', () => {
    const code = 'exec("chmod 777 /tmp/data");';
    const v = overlyPermissive.check('setup.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('detects TLS verification disabled', () => {
    const code = 'process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";';
    const v = overlyPermissive.check('api.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('detects verify=False in Python', () => {
    const code = 'requests.get(url, verify=False)';
    const v = overlyPermissive.check('client.py', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });
});

describe('resource-leak', () => {
  it('detects stream without close', () => {
    const code = 'const stream = fs.createReadStream("data.csv");\nstream.on("data", process);';
    const v = resourceLeak.check('importer.ts', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('passes stream with pipeline', () => {
    const code = 'const stream = fs.createReadStream("data.csv");\npipeline(stream, transform, output);';
    const v = resourceLeak.check('importer.ts', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });

  it('detects Python open() without with', () => {
    const code = 'f = open("data.txt", "r")\ndata = f.read()';
    const v = resourceLeak.check('reader.py', code, code.split('\n'));
    expect(v.length).toBeGreaterThan(0);
  });

  it('passes Python open() with context manager', () => {
    const code = 'with open("data.txt", "r") as f:\n    data = f.read()';
    const v = resourceLeak.check('reader.py', code, code.split('\n'));
    expect(v).toHaveLength(0);
  });
});
