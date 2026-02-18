import type { LintRule, LintViolation } from '../types.js';

export const unboundedLoop: LintRule = {
  name: 'unbounded-loop',
  description: 'Detects while(true) and infinite loops without clear exit conditions (AI agents love these)',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    const patterns = [
      { regex: /\bwhile\s*\(\s*true\s*\)/g, msg: 'while(true) without obvious bound — ensure break/return condition exists' },
      { regex: /\bwhile\s*\(\s*1\s*\)/g, msg: 'while(1) infinite loop — use explicit condition instead' },
      { regex: /\bfor\s*\(\s*;\s*;\s*\)/g, msg: 'for(;;) infinite loop — ensure exit condition exists' },
      { regex: /\bwhile\s+True\s*:/g, msg: 'while True: without obvious bound — ensure break condition exists' },
    ];

    for (const { regex, msg } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const line = content.slice(0, match.index).split('\n').length;
        // Check if there's a break/return within the next 20 lines
        const nextLines = lines.slice(line - 1, line + 19).join('\n');
        const hasExit = /\b(break|return)\b/.test(nextLines);
        if (!hasExit) {
          violations.push({
            rule: 'unbounded-loop',
            severity: 'warning',
            message: msg,
            file,
            line,
            snippet: lines[line - 1]?.trim(),
          });
        }
      }
    }
    return violations;
  },
};
