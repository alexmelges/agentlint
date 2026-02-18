import type { LintRule, LintViolation } from '../types.js';

export const rustPanic: LintRule = {
  name: 'rust-panic',
  description: 'Detects panic!() in library code (non-main, non-test) — return Result instead',
  severity: 'error',
  languages: ['rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    // Skip main.rs and test files
    const basename = file.split('/').pop() ?? '';
    if (basename === 'main.rs') return violations;
    if (/(#\[cfg\(test\)\]|#\[test\])/.test(content)) return violations;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      const match = line.match(/\bpanic!\s*\(/);
      if (match) {
        violations.push({
          rule: 'rust-panic',
          severity: 'error',
          message: 'panic!() in library code — return Result or Option instead',
          file,
          line: i + 1,
          column: match.index! + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
};
