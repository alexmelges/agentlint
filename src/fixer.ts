import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { LintConfig, LintFix, LintRule } from './types.js';
import { allRules } from './rules/index.js';

const DEFAULT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs',
  '.json', '.yaml', '.yml', '.env',
]);

const DEFAULT_IGNORE = [
  'node_modules', 'dist', 'build', '.git', '.next',
  'coverage', '__pycache__', '.venv', 'vendor',
];

export async function applyFixes(target: string, config?: LintConfig): Promise<string> {
  const files = await collectFiles(target, config);
  const fixableRules = getFixableRules(config);
  let totalFixes = 0;
  const fixedFiles: string[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      const ext = path.extname(file).slice(1);
      const allFixes: LintFix[] = [];

      for (const rule of fixableRules) {
        if (rule.languages.length > 0 && !rule.languages.includes(ext)) continue;
        if (rule.fix) {
          allFixes.push(...rule.fix(file, content, lines));
        }
      }

      if (allFixes.length === 0) continue;

      // Apply fixes: sort by line number descending so we don't shift indices
      allFixes.sort((a, b) => b.line - a.line);

      const resultLines = [...lines];
      const appliedLines = new Set<number>();
      for (const fix of allFixes) {
        const lineIdx = fix.line - 1;
        if (appliedLines.has(lineIdx)) continue;
        appliedLines.add(lineIdx);

        if (fix.newText === '') {
          // Remove the line
          resultLines.splice(lineIdx, 1);
        } else if (fix.oldText === resultLines[lineIdx]) {
          // Replace line content
          resultLines[lineIdx] = fix.newText;
        } else {
          // Content-based replacement (e.g., empty-catch replaces within line)
          resultLines[lineIdx] = resultLines[lineIdx].replace(fix.oldText, fix.newText);
        }
      }

      const newContent = resultLines.join('\n');
      if (newContent !== content) {
        await fs.writeFile(file, newContent, 'utf-8');
        totalFixes += allFixes.filter((f) => !appliedLines.has(-1)).length;
        fixedFiles.push(path.relative(process.cwd(), file));
      }
    } catch {
      // Skip files that can't be read
    }
  }

  if (totalFixes === 0) {
    return 'No auto-fixable violations found.';
  }

  const lines = [`Fixed ${fixedFiles.length} file(s):`, ...fixedFiles.map((f) => `  ${f}`)];
  return lines.join('\n');
}

function getFixableRules(config?: LintConfig): LintRule[] {
  return allRules.filter((r) => {
    if (!r.fix) return false;
    if (config?.rules?.[r.name] === 'off') return false;
    return true;
  });
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
