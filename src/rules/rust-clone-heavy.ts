import type { LintRule, LintViolation } from '../types.js';

const CLONE_THRESHOLD = 5;

export const rustCloneHeavy: LintRule = {
  name: 'rust-clone-heavy',
  description: 'Detects excessive .clone() calls — AI agents over-clone to satisfy the borrow checker',
  severity: 'warning',
  languages: ['rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    // Count total .clone() calls in the file
    const clonePattern = /\.clone\(\)/g;
    const cloneLines: number[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('//')) continue;
      if (clonePattern.test(lines[i])) {
        cloneLines.push(i + 1);
      }
      clonePattern.lastIndex = 0;
    }

    if (cloneLines.length >= CLONE_THRESHOLD) {
      // Report each clone call individually when threshold is exceeded
      for (const lineNum of cloneLines) {
        violations.push({
          rule: 'rust-clone-heavy',
          severity: 'warning',
          message: `Excessive .clone() usage (${cloneLines.length} in file) — consider borrowing or using references`,
          file,
          line: lineNum,
          snippet: lines[lineNum - 1].trim(),
        });
      }
    }
    return violations;
  },
};
