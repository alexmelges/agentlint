import type { LintRule, LintViolation, LintFix } from '../types.js';

export const todoFixme: LintRule = {
  name: 'no-todo-fixme',
  description: 'Detects TODO/FIXME/HACK/XXX comments left by agents',
  severity: 'info',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py', 'go', 'rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    const pattern = /\b(TODO|FIXME|HACK|XXX|TEMP|TEMPORARY)\b/g;
    for (let i = 0; i < lines.length; i++) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(lines[i])) !== null) {
        violations.push({
          rule: 'no-todo-fixme',
          severity: 'info',
          message: `${match[1]} comment — resolve before shipping`,
          file,
          line: i + 1,
          column: match.index + 1,
          snippet: lines[i].trim(),
        });
      }
    }
    return violations;
  },
  fix(file, content, lines) {
    const fixes: LintFix[] = [];
    const pattern = /\b(TODO|FIXME|HACK|XXX|TEMP|TEMPORARY)\b/g;
    for (let i = 0; i < lines.length; i++) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[i])) {
        fixes.push({ file, line: i + 1, oldText: lines[i], newText: '' });
      }
    }
    return fixes;
  },
};
