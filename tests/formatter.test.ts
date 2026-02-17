import { describe, it, expect } from 'vitest';
import { formatJSON, formatHuman } from '../src/formatter.js';
import type { LintResult } from '../src/types.js';

describe('formatJSON', () => {
  it('outputs valid JSON with summary', () => {
    const result: LintResult = {
      violations: [
        { rule: 'test', severity: 'error', message: 'msg', file: 'a.ts', line: 1 },
      ],
      filesScanned: 1,
      rulesApplied: 14,
      durationMs: 5,
    };
    const json = JSON.parse(formatJSON(result));
    expect(json.summary.errors).toBe(1);
    expect(json.violations).toHaveLength(1);
  });
});

describe('formatHuman', () => {
  it('shows success for zero violations', () => {
    const result: LintResult = { violations: [], filesScanned: 5, rulesApplied: 14, durationMs: 3 };
    expect(formatHuman(result)).toContain('No issues found');
  });
  it('groups by file', () => {
    const result: LintResult = {
      violations: [
        { rule: 'r1', severity: 'error', message: 'm1', file: 'a.ts', line: 1 },
        { rule: 'r2', severity: 'warning', message: 'm2', file: 'a.ts', line: 5 },
      ],
      filesScanned: 1,
      rulesApplied: 14,
      durationMs: 2,
    };
    const out = formatHuman(result);
    expect(out).toContain('a.ts');
    expect(out).toContain('1 error');
    expect(out).toContain('1 warning');
  });
});
