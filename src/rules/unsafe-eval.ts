import type { LintRule, LintViolation } from '../types.js';

export const unsafeEval: LintRule = {
  name: 'unsafe-eval',
  description: 'Detects eval(), exec(), and similar dynamic code execution (common in AI-generated code)',
  severity: 'error',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    const patterns = [
      { regex: /\beval\s*\(/g, msg: 'eval() is dangerous — AI agents frequently generate it for dynamic behavior' },
      { regex: /\bnew Function\s*\(/g, msg: 'new Function() is equivalent to eval' },
      { regex: /\bexec\s*\(/g, msg: 'exec() allows arbitrary code execution', lang: 'py' },
      { regex: /\bsetTimeout\s*\(\s*["'`]/g, msg: 'setTimeout with string argument acts like eval' },
      { regex: /\bsetInterval\s*\(\s*["'`]/g, msg: 'setInterval with string argument acts like eval' },
    ];

    const ext = file.split('.').pop() ?? '';
    for (const { regex, msg, lang } of patterns) {
      if (lang && lang !== ext && !(lang === 'py' && ext === 'py')) continue;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const line = content.slice(0, match.index).split('\n').length;
        violations.push({
          rule: 'unsafe-eval',
          severity: 'error',
          message: msg,
          file,
          line,
          snippet: lines[line - 1]?.trim(),
        });
      }
    }
    return violations;
  },
};
