import type { LintRule, LintViolation } from '../types.js';

export const noRetry: LintRule = {
  name: 'no-retry-logic',
  description: 'Detects fetch/HTTP calls without retry or backoff logic',
  severity: 'info',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    // Check if file has any retry mechanism
    const hasRetryMechanism = /retry|backoff|attempt|maxRetries|exponential/i.test(content);
    if (hasRetryMechanism) return violations;

    // Find fetch/axios/http calls
    const httpPatterns = [
      /\bfetch\s*\(/g,
      /axios\.\w+\s*\(/g,
      /\.request\s*\(/g,
      /http\.\w+\s*\(/g,
    ];

    for (const pattern of httpPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const line = content.slice(0, match.index).split('\n').length;
        violations.push({
          rule: 'no-retry-logic',
          severity: 'info',
          message: `HTTP call without retry/backoff logic: "${match[0].trim()}"`,
          file,
          line,
          snippet: lines[line - 1]?.trim(),
        });
      }
    }
    return violations;
  },
};
