import type { LintRule, LintViolation } from '../types.js';

export const goGoroutineLeak: LintRule = {
  name: 'go-goroutine-leak',
  description: 'Detects goroutines launched without sync primitives or context cancellation',
  severity: 'warning',
  languages: ['go'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file) || file.endsWith('_test.go')) return violations;

    const syncPatterns = /\b(sync\.WaitGroup|context\.WithCancel|context\.WithTimeout|context\.WithDeadline|errgroup|chan\s|select\s*\{|<-ctx\.Done)\b/;
    const hasSyncInFile = syncPatterns.test(content);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      // Detect: go func() or go someFunc(
      const goMatch = line.match(/\bgo\s+(func\s*\(|[a-zA-Z_]\w*\s*\()/);
      if (goMatch) {
        // Look at surrounding context (20 lines before and after) for sync patterns
        const start = Math.max(0, i - 20);
        const end = Math.min(lines.length, i + 20);
        const surroundingCode = lines.slice(start, end).join('\n');

        if (!syncPatterns.test(surroundingCode) && !hasSyncInFile) {
          violations.push({
            rule: 'go-goroutine-leak',
            severity: 'warning',
            message: 'Goroutine launched without visible sync/context — potential goroutine leak',
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
