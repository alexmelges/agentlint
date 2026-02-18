import type { LintRule, LintViolation } from '../types.js';

export const goBareReturn: LintRule = {
  name: 'go-bare-return',
  description: 'Detects naked returns in functions with named return values (readability smell)',
  severity: 'warning',
  languages: ['go'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file) || file.endsWith('_test.go')) return violations;

    // Find functions with named returns: func foo() (result int, err error) {
    const funcPattern = /\bfunc\s+(?:\([^)]*\)\s*)?\w+\s*\([^)]*\)\s*\((\w+\s+\w+(?:\s*,\s*\w+\s+\w+)*)\)\s*\{/g;
    let funcMatch;
    while ((funcMatch = funcPattern.exec(content)) !== null) {
      const funcStart = content.slice(0, funcMatch.index).split('\n').length;
      // Find the matching closing brace
      let braceDepth = 0;
      let foundOpen = false;
      for (let i = funcStart - 1; i < lines.length; i++) {
        for (const ch of lines[i]) {
          if (ch === '{') { braceDepth++; foundOpen = true; }
          if (ch === '}') braceDepth--;
        }
        if (foundOpen && braceDepth === 0) {
          // Scan function body for bare returns
          for (let j = funcStart; j < i; j++) {
            const trimmed = lines[j].trim();
            if (trimmed.startsWith('//')) continue;
            if (/^\s*return\s*$/.test(lines[j]) || trimmed === 'return') {
              violations.push({
                rule: 'go-bare-return',
                severity: 'warning',
                message: 'Naked return in function with named return values — reduces readability',
                file,
                line: j + 1,
                snippet: lines[j].trim(),
              });
            }
          }
          break;
        }
      }
    }
    return violations;
  },
};
