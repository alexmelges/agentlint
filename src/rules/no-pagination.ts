import type { LintRule, LintViolation } from '../types.js';

const FETCH_ALL_PATTERNS = [
  { pattern: /\.find\(\s*\{\s*\}\s*\)/g, msg: 'Unbounded .find({}) — missing limit/pagination' },
  { pattern: /\.findMany\(\s*\)/g, msg: 'Unbounded .findMany() — missing take/skip' },
  { pattern: /SELECT\s+\*\s+FROM\s+\w+(?!\s+(?:WHERE|LIMIT))/gi, msg: 'SELECT * without WHERE/LIMIT' },
  { pattern: /\.getAll\(\s*\)/g, msg: 'Unbounded .getAll() — missing pagination' },
  { pattern: /\.list\(\s*\)/g, msg: '.list() without pagination parameters' },
];

export const noPagination: LintRule = {
  name: 'no-unbounded-query',
  description: 'Detects database queries and API calls without pagination or limits',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, msg } of FETCH_ALL_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          violations.push({
            rule: 'no-unbounded-query',
            severity: 'warning',
            message: msg,
            file,
            line: i + 1,
            snippet: line.trim(),
          });
        }
      }
    }
    return violations;
  },
};
