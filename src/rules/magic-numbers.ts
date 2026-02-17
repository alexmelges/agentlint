import type { LintRule, LintViolation } from '../types.js';

export const magicNumbers: LintRule = {
  name: 'no-magic-numbers',
  description: 'Detects magic numbers that should be named constants (agent-typical pattern)',
  severity: 'info',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    const ALLOWED = new Set(['-1', '0', '1', '2', '100', '200', '201', '204', '301', '302', '400', '401', '403', '404', '500']);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
      // Skip imports, const declarations with descriptive names
      if (/^\s*(import|const\s+\w+\s*=)/.test(line)) continue;

      const matches = line.matchAll(/(?<![.\w])(\d{2,})\b/g);
      for (const match of matches) {
        const num = match[1];
        if (ALLOWED.has(num)) continue;
        // Skip array indices, string content
        if (/['"`]/.test(line.slice(Math.max(0, match.index! - 20), match.index!))) continue;
        violations.push({
          rule: 'no-magic-numbers',
          severity: 'info',
          message: `Magic number ${num} — extract to a named constant`,
          file,
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
};
