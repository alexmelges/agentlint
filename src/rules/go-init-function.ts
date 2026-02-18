import type { LintRule, LintViolation } from '../types.js';

export const goInitFunction: LintRule = {
  name: 'go-init-function',
  description: 'Detects init() functions — hidden initialization that AI agents frequently generate',
  severity: 'warning',
  languages: ['go'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file) || file.endsWith('_test.go')) return violations;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      // Match: func init() {
      if (/^\s*func\s+init\s*\(\s*\)\s*\{/.test(line)) {
        violations.push({
          rule: 'go-init-function',
          severity: 'warning',
          message: 'init() function — prefer explicit initialization for clarity and testability',
          file,
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
};
