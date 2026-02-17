import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { LintRule, LintResult, LintViolation, LintConfig } from './types.js';
import { allRules } from './rules/index.js';

const DEFAULT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs',
  '.json', '.yaml', '.yml', '.env',
]);

const DEFAULT_IGNORE = [
  'node_modules', 'dist', 'build', '.git', '.next',
  'coverage', '__pycache__', '.venv', 'vendor',
];

export async function lintFiles(target: string, config?: LintConfig): Promise<LintResult> {
  const start = Date.now();
  const files = await collectFiles(target, config);
  const rules = getEnabledRules(config);
  const violations: LintViolation[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    const ext = path.extname(file).slice(1);

    for (const rule of rules) {
      if (rule.languages.length > 0 && !rule.languages.includes(ext)) continue;
      const ruleViolations = rule.check(file, content, lines);
      // Apply severity override
      const overrideSeverity = config?.rules?.[rule.name];
      if (overrideSeverity && overrideSeverity !== 'off') {
        for (const v of ruleViolations) v.severity = overrideSeverity;
      }
      violations.push(...ruleViolations);
    }
  }

  return {
    violations,
    filesScanned: files.length,
    rulesApplied: rules.length,
    durationMs: Date.now() - start,
  };
}

export async function lintStdin(input: string, config?: LintConfig): Promise<LintResult> {
  const start = Date.now();
  const rules = getEnabledRules(config);
  const violations: LintViolation[] = [];

  // Parse diff to extract file changes
  const fileChanges = parseDiff(input);
  for (const { file, addedLines } of fileChanges) {
    const content = addedLines.map((l) => l.text).join('\n');
    const lines = addedLines.map((l) => l.text);
    const ext = path.extname(file).slice(1);

    for (const rule of rules) {
      if (rule.languages.length > 0 && !rule.languages.includes(ext)) continue;
      const ruleViolations = rule.check(file, content, lines);
      // Remap line numbers to original diff line numbers
      for (const v of ruleViolations) {
        const mapped = addedLines[v.line - 1];
        if (mapped) v.line = mapped.originalLine;
      }
      violations.push(...ruleViolations);
    }
  }

  return {
    violations,
    filesScanned: fileChanges.length,
    rulesApplied: rules.length,
    durationMs: Date.now() - start,
  };
}

interface DiffLine { text: string; originalLine: number; }
interface DiffFile { file: string; addedLines: DiffLine[]; }

function parseDiff(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  let currentFile = '';
  let currentLines: DiffLine[] = [];
  let lineNum = 0;

  for (const line of diff.split('\n')) {
    const fileMatch = line.match(/^\+\+\+ b\/(.+)/);
    if (fileMatch) {
      if (currentFile) files.push({ file: currentFile, addedLines: currentLines });
      currentFile = fileMatch[1];
      currentLines = [];
      continue;
    }
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunkMatch) {
      lineNum = parseInt(hunkMatch[1], 10);
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentLines.push({ text: line.slice(1), originalLine: lineNum });
      lineNum++;
    } else if (!line.startsWith('-')) {
      lineNum++;
    }
  }
  if (currentFile) files.push({ file: currentFile, addedLines: currentLines });
  return files;
}

function getEnabledRules(config?: LintConfig): LintRule[] {
  if (!config?.rules) return allRules;
  return allRules.filter((r) => config.rules![r.name] !== 'off');
}

async function collectFiles(dir: string, config?: LintConfig): Promise<string[]> {
  const ignoreSet = new Set([...DEFAULT_IGNORE, ...(config?.ignore ?? [])]);
  const extSet = config?.extensions
    ? new Set(config.extensions.map((e) => (e.startsWith('.') ? e : `.${e}`)))
    : DEFAULT_EXTENSIONS;
  const files: string[] = [];

  async function walk(d: string): Promise<void> {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoreSet.has(entry.name)) continue;
      if (entry.name.startsWith('.') && entry.name !== '.env') continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (extSet.has(path.extname(entry.name))) {
        files.push(full);
      }
    }
  }

  const stat = await fs.stat(dir);
  if (stat.isFile()) return [dir];
  await walk(dir);
  return files;
}
