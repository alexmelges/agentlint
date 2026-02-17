import type { LintRule, LintViolation } from '../types.js';

const PATH_PATTERNS = [
  { pattern: /\/Users\/\w+/g, msg: 'Hardcoded macOS user path' },
  { pattern: /\/home\/\w+/g, msg: 'Hardcoded Linux user path' },
  { pattern: /C:\\\\Users\\\\\w+/g, msg: 'Hardcoded Windows user path' },
  { pattern: /\/tmp\/[a-zA-Z]/g, msg: 'Hardcoded /tmp path' },
  { pattern: /\/var\/log\/[a-zA-Z]/g, msg: 'Hardcoded /var/log path' },
];

export const hardcodedPaths: LintRule = {
  name: 'no-hardcoded-paths',
  description: 'Detects hardcoded file system paths that should use environment variables or config',
  severity: 'error',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py', 'go', 'rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#') || line.trimStart().startsWith('*')) continue;
      for (const { pattern, msg } of PATH_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          violations.push({
            rule: 'no-hardcoded-paths',
            severity: 'error',
            message: `${msg}: "${match[0]}"`,
            file,
            line: i + 1,
            column: match.index + 1,
            snippet: line.trim(),
          });
        }
      }
    }
    return violations;
  },
};
