import type { LintRule, LintViolation } from '../types.js';

export const missingTypes: LintRule = {
  name: 'missing-types',
  description: 'Detects functions without return type annotations (AI agents skip types for speed)',
  severity: 'info',
  languages: ['ts', 'tsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;
    if (/\.d\.ts$/.test(file)) return violations;
    if (!/\.tsx?$/.test(file)) return violations;

    // Match exported function declarations without return types
    // function foo(args): ReturnType vs function foo(args) {
    const funcPattern = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/gm;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      // Check if there's a ): Type before the {
      const beforeBrace = content.slice(match.index, match.index + match[0].length);
      const hasReturnType = /\)\s*:\s*\S/.test(beforeBrace);
      if (!hasReturnType) {
        const line = content.slice(0, match.index).split('\n').length;
        violations.push({
          rule: 'missing-types',
          severity: 'info',
          message: `Function '${match[1]}' is missing a return type annotation`,
          file,
          line,
          snippet: lines[line - 1]?.trim(),
        });
      }
    }
    return violations;
  },
};
