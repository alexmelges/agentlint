import type { LintRule, LintViolation } from '../types.js';

export const noTimeout: LintRule = {
  name: 'no-timeout',
  description: 'Detects HTTP/network calls without timeout configuration',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    // Check if file has timeout configuration
    const hasTimeoutConfig = /timeout|AbortSignal|signal\s*:/.test(content);
    if (hasTimeoutConfig) return violations;

    // Find fetch calls without signal/timeout
    const fetchPattern = /\bfetch\s*\(/g;
    let match;
    while ((match = fetchPattern.exec(content)) !== null) {
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({
        rule: 'no-timeout',
        severity: 'warning',
        message: 'fetch() without timeout/AbortSignal — can hang indefinitely',
        file,
        line,
        snippet: lines[line - 1]?.trim(),
      });
    }
    return violations;
  },
};
