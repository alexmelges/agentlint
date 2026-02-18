import type { LintRule, LintViolation } from '../types.js';

export const rustUnsafeBlock: LintRule = {
  name: 'rust-unsafe-block',
  description: 'Detects unsafe blocks without SAFETY comments',
  severity: 'error',
  languages: ['rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      // Match: unsafe { ... } blocks
      if (/\bunsafe\s*\{/.test(line)) {
        // Check preceding lines for a SAFETY comment
        const prevLines = lines.slice(Math.max(0, i - 3), i).join('\n');
        if (!/\/\/\s*SAFETY\b/i.test(prevLines)) {
          violations.push({
            rule: 'rust-unsafe-block',
            severity: 'error',
            message: 'unsafe block without `// SAFETY:` comment — document why this is safe',
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
