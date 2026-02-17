import { describe, it, expect } from 'vitest';
import { lintStdin } from '../src/engine.js';

describe('lintStdin (diff parsing)', () => {
  it('parses unified diff and lints added lines', async () => {
    const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,3 +1,5 @@
 import express from 'express';
+const password = "hunter2secret";
+console.log("starting server");
 const app = express();
`;
    const result = await lintStdin(diff);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.rule === 'no-credential-leak')).toBe(true);
  });

  it('returns empty for clean diff', async () => {
    const diff = `diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,3 +1,4 @@
 import express from 'express';
+const port = process.env.PORT;
 const app = express();
`;
    const result = await lintStdin(diff);
    const errors = result.violations.filter((v) => v.severity === 'error');
    expect(errors).toHaveLength(0);
  });
});
