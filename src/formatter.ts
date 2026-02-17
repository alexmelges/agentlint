import type { LintResult, LintViolation, Severity } from './types.js';

const SEVERITY_COLORS: Record<Severity, string> = {
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const SEVERITY_ICONS: Record<Severity, string> = {
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

export function formatHuman(result: LintResult): string {
  if (result.violations.length === 0) {
    return `${BOLD}✓ No issues found${RESET} (${result.filesScanned} files, ${result.rulesApplied} rules, ${result.durationMs}ms)\n`;
  }

  // Group by file
  const byFile = new Map<string, LintViolation[]>();
  for (const v of result.violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file)!.push(v);
  }

  const lines: string[] = [];
  for (const [file, violations] of byFile) {
    lines.push(`\n${BOLD}${file}${RESET}`);
    for (const v of violations.sort((a, b) => a.line - b.line)) {
      const color = SEVERITY_COLORS[v.severity];
      const icon = SEVERITY_ICONS[v.severity];
      lines.push(
        `  ${DIM}${v.line}:${v.column ?? 1}${RESET}  ${color}${icon} ${v.severity}${RESET}  ${v.message}  ${DIM}${v.rule}${RESET}`
      );
    }
  }

  const errors = result.violations.filter((v) => v.severity === 'error').length;
  const warnings = result.violations.filter((v) => v.severity === 'warning').length;
  const infos = result.violations.filter((v) => v.severity === 'info').length;

  lines.push('');
  const parts: string[] = [];
  if (errors) parts.push(`${SEVERITY_COLORS.error}${errors} error${errors > 1 ? 's' : ''}${RESET}`);
  if (warnings) parts.push(`${SEVERITY_COLORS.warning}${warnings} warning${warnings > 1 ? 's' : ''}${RESET}`);
  if (infos) parts.push(`${SEVERITY_COLORS.info}${infos} info${RESET}`);
  lines.push(`${parts.join(', ')} (${result.filesScanned} files, ${result.rulesApplied} rules, ${result.durationMs}ms)`);

  return lines.join('\n') + '\n';
}

export function formatJSON(result: LintResult): string {
  return JSON.stringify({
    violations: result.violations,
    summary: {
      total: result.violations.length,
      errors: result.violations.filter((v) => v.severity === 'error').length,
      warnings: result.violations.filter((v) => v.severity === 'warning').length,
      infos: result.violations.filter((v) => v.severity === 'info').length,
      filesScanned: result.filesScanned,
      rulesApplied: result.rulesApplied,
      durationMs: result.durationMs,
    },
  }, null, 2);
}
