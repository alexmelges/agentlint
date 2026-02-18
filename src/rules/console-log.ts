import type { LintRule, LintViolation, LintFix } from '../types.js';

export const consoleLog: LintRule = {
  name: 'no-console-log',
  description: 'Detects console.log usage that should be replaced with structured logging',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;
      const match = line.match(/console\.(log|warn|error|info|debug)\s*\(/);
      if (match) {
        violations.push({
          rule: 'no-console-log',
          severity: 'warning',
          message: `console.${match[1]}() — use a structured logger instead`,
          file,
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
  fix(file, content, lines) {
    const fixes: LintFix[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return fixes;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;
      if (/console\.(log|warn|error|info|debug)\s*\(/.test(line)) {
        fixes.push({ file, line: i + 1, oldText: lines[i], newText: '' });
      }
    }
    return fixes;
  },
};
