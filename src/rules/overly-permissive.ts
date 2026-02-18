import type { LintRule, LintViolation } from '../types.js';

export const overlyPermissive: LintRule = {
  name: 'overly-permissive',
  description: 'Detects overly permissive CORS, permissions, and security settings (AI defaults to wide-open)',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py', 'json', 'yaml', 'yml'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    const patterns = [
      { regex: /['"]?\*['"]?\s*(?:$|,|\]|\})/gm, context: /cors|origin|allow/i, msg: 'Wildcard CORS origin (*) — restrict to specific domains' },
      { regex: /0\.0\.0\.0/g, context: /listen|host|bind/i, msg: 'Binding to 0.0.0.0 — consider restricting to specific interface' },
      { regex: /chmod\s+777/g, context: null, msg: 'chmod 777 is world-writable — use restrictive permissions' },
      { regex: /0o?777\b/g, context: /mode|permission/i, msg: 'Permission mode 777 is world-writable' },
      { regex: /disable.*(?:ssl|tls|certificate|verify)/gi, context: null, msg: 'Disabling SSL/TLS verification is insecure' },
      { regex: /verify\s*[=:]\s*(?:false|False)/g, context: null, msg: 'SSL verification disabled — AI agents often do this to avoid certificate errors' },
      { regex: /NODE_TLS_REJECT_UNAUTHORIZED.*['"]0['"]/g, context: null, msg: 'NODE_TLS_REJECT_UNAUTHORIZED=0 disables all TLS verification' },
    ];

    for (const { regex, context, msg } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const line = content.slice(0, match.index).split('\n').length;
        // If context is specified, check surrounding lines
        if (context) {
          const surroundingStart = Math.max(0, line - 3);
          const surroundingEnd = Math.min(lines.length, line + 2);
          const surrounding = lines.slice(surroundingStart, surroundingEnd).join('\n');
          if (!context.test(surrounding)) continue;
        }
        violations.push({
          rule: 'overly-permissive',
          severity: 'warning',
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
