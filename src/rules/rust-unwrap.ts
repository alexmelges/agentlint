import type { LintRule, LintViolation } from '../types.js';

export const rustUnwrap: LintRule = {
  name: 'rust-unwrap',
  description: 'Detects .unwrap() calls outside of tests — use proper error handling with ? or match',
  severity: 'error',
  languages: ['rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    // Skip test files
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;
    // Skip Rust test modules
    const isTestModule = /(#\[cfg\(test\)\]|#\[test\])/.test(content);
    if (isTestModule) return violations;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      const pattern = /\.unwrap\(\)/g;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        violations.push({
          rule: 'rust-unwrap',
          severity: 'error',
          message: '.unwrap() will panic on None/Err — use `?`, `unwrap_or`, or `match` instead',
          file,
          line: i + 1,
          column: match.index + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
};
