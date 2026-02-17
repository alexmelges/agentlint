import type { LintRule, LintViolation } from '../types.js';

export const noInputValidation: LintRule = {
  name: 'no-input-validation',
  description: 'Detects HTTP handlers and API endpoints without input validation',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];

    // Detect Express/Fastify/Hono route handlers
    const handlerPatterns = [
      /\.(get|post|put|patch|delete)\s*\(\s*['"`]/g,
      /app\.(get|post|put|patch|delete)\s*\(/g,
      /router\.(get|post|put|patch|delete)\s*\(/g,
    ];

    for (const pattern of handlerPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const startLine = content.slice(0, match.index).split('\n').length;
        // Look ahead for validation in the handler body
        const handlerBody = content.slice(match.index, match.index + 500);
        const hasValidation =
          /zod|yup|joi|validate|schema|safeParse|parse\(|ajv|superstruct/.test(handlerBody) ||
          /typeof\s+\w+\s*[!=]==/.test(handlerBody) ||
          /if\s*\(\s*!\s*\w+/.test(handlerBody);

        if (!hasValidation) {
          violations.push({
            rule: 'no-input-validation',
            severity: 'warning',
            message: `HTTP handler without input validation`,
            file,
            line: startLine,
            snippet: lines[startLine - 1]?.trim(),
          });
        }
      }
    }
    return violations;
  },
};
