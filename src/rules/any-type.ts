import type { LintRule, LintViolation, LintFix } from '../types.js';

export const anyType: LintRule = {
  name: 'no-any-type',
  description: 'Detects usage of `any` type — agents frequently use it as a shortcut',
  severity: 'warning',
  languages: ['ts', 'tsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;
      // Match : any, as any, <any>, any[]
      const pattern = /(?::\s*any\b|as\s+any\b|<any>|any\[\])/g;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        violations.push({
          rule: 'no-any-type',
          severity: 'warning',
          message: `Usage of \`any\` type — define a proper type`,
          file,
          line: i + 1,
          column: match.index + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
  fix(file, content, lines) {
    const fixes: LintFix[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;
      if (/(?::\s*any\b|as\s+any\b|<any>|any\[\])/.test(line)) {
        let fixed = line;
        fixed = fixed.replace(/:\s*any\b/g, ': unknown');
        fixed = fixed.replace(/as\s+any\b/g, 'as unknown');
        fixed = fixed.replace(/<any>/g, '<unknown>');
        fixed = fixed.replace(/any\[\]/g, 'unknown[]');
        if (fixed !== line) {
          fixes.push({ file, line: i + 1, oldText: line, newText: fixed });
        }
      }
    }
    return fixes;
  },
};
