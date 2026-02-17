import type { LintRule, LintViolation } from '../types.js';

export const missingErrorHandling: LintRule = {
  name: 'no-unhandled-async',
  description: 'Detects async functions and promises without try/catch or .catch()',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];

    // Find async functions without try/catch
    const asyncFnRegex = /async\s+(?:function\s+)?(\w+)?\s*\(/g;
    let match;
    while ((match = asyncFnRegex.exec(content)) !== null) {
      const startIdx = match.index;
      // Look ahead for try block within the function
      const fnBody = extractBlock(content, startIdx);
      if (fnBody && !fnBody.includes('try') && !fnBody.includes('.catch(') && fnBody.length > 50) {
        const line = content.slice(0, startIdx).split('\n').length;
        violations.push({
          rule: 'no-unhandled-async',
          severity: 'warning',
          message: `Async function${match[1] ? ` "${match[1]}"` : ''} has no try/catch or .catch() error handling`,
          file,
          line,
          snippet: lines[line - 1]?.trim(),
        });
      }
    }

    // Find .then() without .catch()
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('.then(') && !lines[i].includes('.catch(')) {
        // Check next few lines for .catch
        const nextLines = lines.slice(i, i + 5).join('\n');
        if (!nextLines.includes('.catch(')) {
          violations.push({
            rule: 'no-unhandled-async',
            severity: 'warning',
            message: '.then() without .catch() — unhandled promise rejection',
            file,
            line: i + 1,
            snippet: lines[i].trim(),
          });
        }
      }
    }

    return violations;
  },
};

function extractBlock(content: string, startIdx: number): string | null {
  const braceIdx = content.indexOf('{', startIdx);
  if (braceIdx === -1) return null;
  let depth = 1;
  let i = braceIdx + 1;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    i++;
  }
  return content.slice(braceIdx, i);
}
