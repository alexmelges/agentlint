import type { LintRule, LintViolation } from '../types.js';

export const goErrorIgnored: LintRule = {
  name: 'go-error-ignored',
  description: 'Detects Go code that ignores error returns (blank identifier or unchecked err)',
  severity: 'error',
  languages: ['go'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file) || file.endsWith('_test.go')) return violations;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      // Detect: val, _ := someFunc() — blank identifier discarding error
      const blankMatch = line.match(/,\s*_\s*:?=/);
      if (blankMatch) {
        // Make sure it's likely an error-returning function (has := or = with func call)
        if (/\w+\s*\(/.test(line)) {
          violations.push({
            rule: 'go-error-ignored',
            severity: 'error',
            message: 'Error return value ignored with blank identifier `_`',
            file,
            line: i + 1,
            column: blankMatch.index! + 1,
            snippet: line.trim(),
          });
        }
      }

      // Detect: someFunc() on its own line without capturing error
      // e.g., file.Close() or db.Exec(...) without err check
      const callOnlyMatch = line.match(/^\s+(\w+(?:\.\w+)*)\s*\([^)]*\)\s*$/);
      if (callOnlyMatch) {
        const funcName = callOnlyMatch[1];
        // Skip common non-error-returning calls
        const safePatterns = /^(fmt\.Print|fmt\.Println|fmt\.Printf|log\.|panic|go |defer |append|len|cap|make|new|close|delete|copy|recover)$/;
        if (!safePatterns.test(funcName) && !line.trimStart().startsWith('go ') && !line.trimStart().startsWith('defer ')) {
          // Check if next lines check err — simple heuristic
          const nextLines = lines.slice(i + 1, i + 3).join(' ');
          if (!/\berr\b/.test(nextLines)) {
            violations.push({
              rule: 'go-error-ignored',
              severity: 'error',
              message: `Return value of ${funcName}() likely ignored — check for errors`,
              file,
              line: i + 1,
              snippet: line.trim(),
            });
          }
        }
      }
    }
    return violations;
  },
};
