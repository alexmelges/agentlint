import type { LintRule, LintViolation } from '../types.js';

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
};
