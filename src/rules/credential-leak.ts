import type { LintRule, LintViolation } from '../types.js';

const CREDENTIAL_PATTERNS = [
  { pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]/gi, msg: 'Hardcoded password' },
  { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][^'"]{8,}['"]/gi, msg: 'Hardcoded API key' },
  { pattern: /(?:secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi, msg: 'Hardcoded secret/token' },
  { pattern: /(?:sk|pk)[-_](?:live|test)[-_]\w{10,}/g, msg: 'Stripe-style API key' },
  { pattern: /ghp_[A-Za-z0-9_]{36,}/g, msg: 'GitHub personal access token' },
  { pattern: /AIza[0-9A-Za-z_-]{35}/g, msg: 'Google API key' },
  { pattern: /(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*['"][^'"]+['"]/gi, msg: 'AWS credential' },
  { pattern: /Bearer\s+[A-Za-z0-9_.-]{20,}/g, msg: 'Hardcoded Bearer token' },
];

export const credentialLeak: LintRule = {
  name: 'no-credential-leak',
  description: 'Detects hardcoded credentials, API keys, and tokens in source code',
  severity: 'error',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py', 'go', 'rs', 'env', 'json', 'yaml', 'yml'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    // Skip .env.example files
    if (file.endsWith('.example') || file.endsWith('.template')) return violations;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, msg } of CREDENTIAL_PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          // Skip env var references
          if (/process\.env|os\.environ|std::env|env::var/.test(line)) continue;
          violations.push({
            rule: 'no-credential-leak',
            severity: 'error',
            message: `${msg} detected`,
            file,
            line: i + 1,
            column: match.index + 1,
            snippet: line.trim().replace(/(['"])[^'"]{4}[^'"]*(['"])/, '$1****$2'),
          });
        }
      }
    }
    return violations;
  },
};
