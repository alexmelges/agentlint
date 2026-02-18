import type { LintResult, LintViolation, LintRule, Severity } from './types.js';
import { allRules } from './rules/index.js';

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

const SEVERITY_TO_SARIF: Record<Severity, string> = {
  error: 'error',
  warning: 'warning',
  info: 'note',
};

export function formatSARIF(result: LintResult): string {
  const ruleMap = new Map<string, LintRule>();
  for (const r of allRules) ruleMap.set(r.name, r);

  // Collect unique rule ids from violations
  const usedRules = [...new Set(result.violations.map((v) => v.rule))];

  const sarifRules = usedRules.map((id, index) => {
    const rule = ruleMap.get(id);
    return {
      id,
      name: id,
      shortDescription: { text: rule?.description ?? id },
      defaultConfiguration: {
        level: SEVERITY_TO_SARIF[rule?.severity ?? 'warning'],
      },
      properties: {
        tags: rule?.languages?.length ? rule.languages : ['general'],
      },
    };
  });

  const ruleIndex = new Map<string, number>();
  usedRules.forEach((id, i) => ruleIndex.set(id, i));

  const results = result.violations.map((v) => ({
    ruleId: v.rule,
    ruleIndex: ruleIndex.get(v.rule) ?? 0,
    level: SEVERITY_TO_SARIF[v.severity],
    message: { text: v.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: v.file.replace(/^\//, ''), uriBaseId: '%SRCROOT%' },
          region: {
            startLine: v.line,
            startColumn: v.column ?? 1,
          },
        },
      },
    ],
    ...(v.snippet ? { properties: { snippet: v.snippet } } : {}),
  }));

  const sarif = {
    version: '2.1.0',
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'agentlint',
            version: '0.6.0',
            informationUri: 'https://github.com/alexmelges/agentlint',
            rules: sarifRules,
          },
        },
        results,
        invocations: [
          {
            executionSuccessful: true,
            properties: {
              filesScanned: result.filesScanned,
              rulesApplied: result.rulesApplied,
              durationMs: result.durationMs,
            },
          },
        ],
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
