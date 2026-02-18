import type { LintRule, LintViolation } from '../types.js';

export const goDeferInLoop: LintRule = {
  name: 'go-defer-in-loop',
  description: 'Detects defer inside for loops (resource leak — deferred calls run at function exit, not loop iteration)',
  severity: 'error',
  languages: ['go'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file) || file.endsWith('_test.go')) return violations;

    let loopDepth = 0;
    let braceStack: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//')) continue;

      // Track for loop entry
      if (/^\s*for\s/.test(line)) {
        loopDepth++;
        braceStack.push('for');
      }

      // Count braces to track scope
      for (const ch of line) {
        if (ch === '{') {
          if (braceStack.length === 0 || braceStack[braceStack.length - 1] !== 'for') {
            braceStack.push('block');
          }
        } else if (ch === '}') {
          const top = braceStack.pop();
          if (top === 'for') {
            loopDepth--;
          }
        }
      }

      // Detect defer inside loop
      if (loopDepth > 0 && /^\s*defer\s/.test(line)) {
        violations.push({
          rule: 'go-defer-in-loop',
          severity: 'error',
          message: 'defer inside for loop — deferred calls execute at function exit, not loop iteration end',
          file,
          line: i + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
};
