import type { LintRule, LintViolation } from '../types.js';

const SYNC_PATTERNS = [
  /\breadFileSync\b/g,
  /\bwriteFileSync\b/g,
  /\bexistsSync\b/g,
  /\bmkdirSync\b/g,
  /\breaddirSync\b/g,
  /\bstatSync\b/g,
  /\bunlinkSync\b/g,
  /\bcopyFileSync\b/g,
];

export const syncFs: LintRule = {
  name: 'no-sync-fs',
  description: 'Detects synchronous file system operations that block the event loop',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    // Allow in CLI entry points and config files
    if (/cli\.[tj]s$/.test(file) || /config\.[tj]s$/.test(file)) return violations;
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of SYNC_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(lines[i]);
        if (match) {
          violations.push({
            rule: 'no-sync-fs',
            severity: 'warning',
            message: `Synchronous ${match[0]} blocks the event loop — use async version`,
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
