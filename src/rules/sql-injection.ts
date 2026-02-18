import type { LintRule, LintViolation } from '../types.js';

export const sqlInjection: LintRule = {
  name: 'sql-injection',
  description: 'Detects string concatenation/interpolation in SQL queries (AI agents skip parameterization)',
  severity: 'error',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    // Detect template literals with SQL keywords
    const templateSqlPattern = /`[^`]*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b[^`]*\$\{[^}]+\}[^`]*`/gi;
    let match;
    while ((match = templateSqlPattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        rule: 'sql-injection',
        severity: 'error',
        message: 'SQL query uses template literal interpolation — use parameterized queries instead',
        file,
        line,
        snippet: lines[line - 1]?.trim(),
      });
    }

    // Detect string concatenation with SQL keywords
    const concatSqlPattern = /["'](?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^"']*["']\s*\+/gi;
    while ((match = concatSqlPattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        rule: 'sql-injection',
        severity: 'error',
        message: 'SQL query uses string concatenation — use parameterized queries instead',
        file,
        line,
        snippet: lines[line - 1]?.trim(),
      });
    }

    // Python f-string SQL
    const fstringSqlPattern = /f["'](?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^"']*\{[^}]+\}[^"']*["']/gi;
    while ((match = fstringSqlPattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        rule: 'sql-injection',
        severity: 'error',
        message: 'SQL query uses f-string interpolation — use parameterized queries instead',
        file,
        line,
        snippet: lines[line - 1]?.trim(),
      });
    }

    return violations;
  },
};
