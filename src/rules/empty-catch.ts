import type { LintRule, LintViolation, LintFix } from '../types.js';

export const emptyCatch: LintRule = {
  name: 'no-empty-catch',
  description: 'Detects empty catch blocks that silently swallow errors',
  severity: 'error',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    const pattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        rule: 'no-empty-catch',
        severity: 'error',
        message: 'Empty catch block silently swallows errors',
        file,
        line,
        snippet: lines[line - 1]?.trim(),
      });
    }
    return violations;
  },
  fix(file, content, lines) {
    const fixes: LintFix[] = [];
    const pattern = /catch\s*\(([^)]*)\)\s*\{\s*\}/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      const param = match[1].trim() || 'e';
      const oldText = match[0];
      const newText = `catch (${param}) { /* TODO: handle error */ }`;
      fixes.push({ file, line, oldText, newText });
    }
    return fixes;
  },
};
