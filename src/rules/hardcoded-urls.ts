import type { LintRule, LintViolation } from '../types.js';

const URL_PATTERNS = [
  { pattern: /https?:\/\/localhost[:/]/g, msg: 'Hardcoded localhost URL' },
  { pattern: /https?:\/\/127\.0\.0\.1[:/]/g, msg: 'Hardcoded 127.0.0.1 URL' },
  { pattern: /https?:\/\/0\.0\.0\.0[:/]/g, msg: 'Hardcoded 0.0.0.0 URL' },
  { pattern: /(?<!\w):\d{4,5}(?:\/|\b)/g, msg: 'Hardcoded port number' },
];

export const hardcodedUrls: LintRule = {
  name: 'no-hardcoded-urls',
  description: 'Detects hardcoded localhost URLs and port numbers',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py', 'go', 'rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    // Skip test files and config files
    if (/\.(test|spec|config)\.[a-z]+$/.test(file)) return violations;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) continue;
      for (const { pattern, msg } of URL_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          violations.push({
            rule: 'no-hardcoded-urls',
            severity: 'warning',
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
