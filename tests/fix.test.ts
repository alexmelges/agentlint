import { describe, it, expect } from 'vitest';
import { consoleLog } from '../src/rules/console-log.js';
import { todoFixme } from '../src/rules/todo-fixme.js';
import { emptyCatch } from '../src/rules/empty-catch.js';
import { anyType } from '../src/rules/any-type.js';

function getFixes(rule: any, content: string, file = 'test.ts') {
  return rule.fix!(file, content, content.split('\n'));
}

// ── console-log fix ───────────────────────────────────────────────

describe('console-log fix', () => {
  it('produces fix to remove console.log line', () => {
    const code = `const x = 1;\nconsole.log(x);\nreturn x;`;
    const fixes = getFixes(consoleLog, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].line).toBe(2);
    expect(fixes[0].newText).toBe('');
  });

  it('removes multiple console lines', () => {
    const code = `console.log("a");\nconsole.warn("b");\nconsole.error("c");`;
    const fixes = getFixes(consoleLog, code);
    expect(fixes).toHaveLength(3);
  });

  it('skips test files', () => {
    const code = `console.log("test");`;
    const fixes = getFixes(consoleLog, code, 'app.test.ts');
    expect(fixes).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// console.log("debug");`;
    const fixes = getFixes(consoleLog, code);
    expect(fixes).toHaveLength(0);
  });
});

// ── todo-fixme fix ────────────────────────────────────────────────

describe('todo-fixme fix', () => {
  it('produces fix to remove TODO comment line', () => {
    const code = `const x = 1;\n// TODO: fix this\nreturn x;`;
    const fixes = getFixes(todoFixme, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].line).toBe(2);
    expect(fixes[0].newText).toBe('');
  });

  it('removes FIXME comment line', () => {
    const code = `// FIXME: broken`;
    const fixes = getFixes(todoFixme, code);
    expect(fixes).toHaveLength(1);
  });

  it('removes HACK comment line', () => {
    const code = `// HACK: workaround`;
    const fixes = getFixes(todoFixme, code);
    expect(fixes).toHaveLength(1);
  });
});

// ── empty-catch fix ───────────────────────────────────────────────

describe('empty-catch fix', () => {
  it('replaces empty catch with TODO comment', () => {
    const code = `try { x() } catch (e) {}`;
    const fixes = getFixes(emptyCatch, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].newText).toContain('TODO: handle error');
  });

  it('preserves the catch parameter', () => {
    const code = `try { x() } catch (error) {}`;
    const fixes = getFixes(emptyCatch, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].newText).toContain('catch (error)');
  });
});

// ── any-type fix ──────────────────────────────────────────────────

describe('any-type fix', () => {
  it('replaces : any with : unknown', () => {
    const code = `function f(x: any) {}`;
    const fixes = getFixes(anyType, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].newText).toContain(': unknown');
    expect(fixes[0].newText).not.toContain(': any');
  });

  it('replaces as any with as unknown', () => {
    const code = `const x = foo as any;`;
    const fixes = getFixes(anyType, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].newText).toContain('as unknown');
  });

  it('replaces <any> with <unknown>', () => {
    const code = `const arr: Array<any> = [];`;
    const fixes = getFixes(anyType, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].newText).toContain('<unknown>');
  });

  it('replaces any[] with unknown[]', () => {
    const code = `const arr: any[] = [];`;
    const fixes = getFixes(anyType, code);
    expect(fixes).toHaveLength(1);
    expect(fixes[0].newText).toContain('unknown[]');
  });

  it('skips comments', () => {
    const code = `// x: any`;
    const fixes = getFixes(anyType, code);
    expect(fixes).toHaveLength(0);
  });
});

// ── fix function existence ────────────────────────────────────────

describe('fix function availability', () => {
  it('console-log has fix function', () => {
    expect(typeof consoleLog.fix).toBe('function');
  });

  it('todo-fixme has fix function', () => {
    expect(typeof todoFixme.fix).toBe('function');
  });

  it('empty-catch has fix function', () => {
    expect(typeof emptyCatch.fix).toBe('function');
  });

  it('any-type has fix function', () => {
    expect(typeof anyType.fix).toBe('function');
  });
});
