import type { LintRule, LintViolation } from '../types.js';

export const goNilCheckMissing: LintRule = {
  name: 'go-nil-check-missing',
  description: 'Detects pointer dereference without nil check after error-returning function calls',
  severity: 'error',
  languages: ['go'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file) || file.endsWith('_test.go')) return violations;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      // Detect: result, err := someFunc() followed by use of result without nil/err check
      const assignMatch = line.match(/(\w+)\s*,\s*(\w+)\s*:?=\s*\w+/);
      if (assignMatch && assignMatch[2] === 'err') {
        const resultVar = assignMatch[1];
        // Check if next lines check err before using result
        const nextLines = lines.slice(i + 1, Math.min(i + 5, lines.length));
        let errChecked = false;
        for (const nextLine of nextLines) {
          if (/\bif\s+err\s*!=\s*nil\b/.test(nextLine)) {
            errChecked = true;
            break;
          }
          // If the result is used (dereferenced) before err check
          const derefPattern = new RegExp(`\\b${resultVar}\\s*\\.`);
          if (derefPattern.test(nextLine) && !errChecked) {
            violations.push({
              rule: 'go-nil-check-missing',
              severity: 'error',
              message: `'${resultVar}' used before checking 'err' — may dereference nil pointer`,
              file,
              line: i + 1,
              snippet: line.trim(),
            });
            break;
          }
        }
      }
    }
    return violations;
  },
};
