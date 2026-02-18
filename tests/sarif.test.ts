import { describe, it, expect } from 'vitest';
import { formatSARIF } from '../src/formatter.js';
import type { LintResult } from '../src/types.js';

describe('SARIF formatter', () => {
  const baseResult: LintResult = {
    violations: [],
    filesScanned: 5,
    rulesApplied: 20,
    durationMs: 42,
  };

  it('produces valid SARIF 2.1.0 structure with no violations', () => {
    const sarif = JSON.parse(formatSARIF(baseResult));
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.$schema).toContain('sarif-schema-2.1.0');
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].tool.driver.name).toBe('agentlint');
    expect(sarif.runs[0].results).toHaveLength(0);
    expect(sarif.runs[0].tool.driver.rules).toHaveLength(0);
  });

  it('maps violations to SARIF results with correct structure', () => {
    const result: LintResult = {
      ...baseResult,
      violations: [
        {
          rule: 'no-console-log',
          severity: 'warning',
          message: 'console.log found',
          file: 'src/app.ts',
          line: 10,
          column: 5,
        },
        {
          rule: 'no-credential-leak',
          severity: 'error',
          message: 'Hardcoded API key',
          file: 'src/config.ts',
          line: 3,
          column: 1,
          snippet: 'const key = "sk-..."',
        },
      ],
    };

    const sarif = JSON.parse(formatSARIF(result));
    const run = sarif.runs[0];

    // Rules should include both unique rules
    expect(run.tool.driver.rules).toHaveLength(2);
    expect(run.tool.driver.rules[0].id).toBe('no-console-log');
    expect(run.tool.driver.rules[1].id).toBe('no-credential-leak');

    // Results
    expect(run.results).toHaveLength(2);

    const r0 = run.results[0];
    expect(r0.ruleId).toBe('no-console-log');
    expect(r0.level).toBe('warning');
    expect(r0.message.text).toBe('console.log found');
    expect(r0.locations[0].physicalLocation.artifactLocation.uri).toBe('src/app.ts');
    expect(r0.locations[0].physicalLocation.region.startLine).toBe(10);
    expect(r0.locations[0].physicalLocation.region.startColumn).toBe(5);

    const r1 = run.results[1];
    expect(r1.ruleId).toBe('no-credential-leak');
    expect(r1.level).toBe('error');
    expect(r1.properties.snippet).toBe('const key = "sk-..."');
  });

  it('maps severity correctly', () => {
    const result: LintResult = {
      ...baseResult,
      violations: [
        { rule: 'no-console-log', severity: 'error', message: 'err', file: 'a.ts', line: 1 },
        { rule: 'no-console-log', severity: 'warning', message: 'warn', file: 'b.ts', line: 2 },
        { rule: 'no-console-log', severity: 'info', message: 'info', file: 'c.ts', line: 3 },
      ],
    };
    const sarif = JSON.parse(formatSARIF(result));
    expect(sarif.runs[0].results[0].level).toBe('error');
    expect(sarif.runs[0].results[1].level).toBe('warning');
    expect(sarif.runs[0].results[2].level).toBe('note');
  });

  it('deduplicates rules from multiple violations', () => {
    const result: LintResult = {
      ...baseResult,
      violations: [
        { rule: 'no-todo-fixme', severity: 'info', message: 'TODO found', file: 'a.ts', line: 1 },
        { rule: 'no-todo-fixme', severity: 'info', message: 'FIXME found', file: 'b.ts', line: 5 },
      ],
    };
    const sarif = JSON.parse(formatSARIF(result));
    expect(sarif.runs[0].tool.driver.rules).toHaveLength(1);
    expect(sarif.runs[0].results).toHaveLength(2);
    expect(sarif.runs[0].results[0].ruleIndex).toBe(0);
    expect(sarif.runs[0].results[1].ruleIndex).toBe(0);
  });

  it('strips leading slash from file paths', () => {
    const result: LintResult = {
      ...baseResult,
      violations: [
        { rule: 'no-console-log', severity: 'warning', message: 'test', file: '/home/user/src/app.ts', line: 1 },
      ],
    };
    const sarif = JSON.parse(formatSARIF(result));
    expect(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri).toBe('home/user/src/app.ts');
  });

  it('includes invocation metadata', () => {
    const sarif = JSON.parse(formatSARIF(baseResult));
    const inv = sarif.runs[0].invocations[0];
    expect(inv.executionSuccessful).toBe(true);
    expect(inv.properties.filesScanned).toBe(5);
    expect(inv.properties.rulesApplied).toBe(20);
    expect(inv.properties.durationMs).toBe(42);
  });
});
