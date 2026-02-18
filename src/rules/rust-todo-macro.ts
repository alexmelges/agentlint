import type { LintRule, LintViolation } from '../types.js';

export const rustTodoMacro: LintRule = {
  name: 'rust-todo-macro',
  description: 'Detects todo!() and unimplemented!() macros left in code',
  severity: 'error',
  languages: ['rs'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith('//')) continue;

      const pattern = /\b(todo|unimplemented)!\s*\(/g;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        violations.push({
          rule: 'rust-todo-macro',
          severity: 'error',
          message: `${match[1]}!() macro left in code — implement before shipping`,
          file,
          line: i + 1,
          column: match.index + 1,
          snippet: line.trim(),
        });
      }
    }
    return violations;
  },
};
