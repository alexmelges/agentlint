import type { LintRule, LintViolation } from '../types.js';

export const resourceLeak: LintRule = {
  name: 'resource-leak',
  description: 'Detects opened resources (files, connections, streams) without proper cleanup',
  severity: 'warning',
  languages: ['ts', 'js', 'tsx', 'jsx', 'py'],
  check(file, content, lines) {
    const violations: LintViolation[] = [];
    if (/\.(test|spec)\.[a-z]+$/.test(file)) return violations;

    // JS/TS: createReadStream/createWriteStream without .close() or pipeline
    const streamPattern = /\bcreate(?:Read|Write)Stream\s*\(/g;
    let match;
    while ((match = streamPattern.exec(content)) !== null) {
      if (!/\.close\(\)|\.destroy\(\)|pipeline|\.pipe\(/.test(content)) {
        const line = content.slice(0, match.index).split('\n').length;
        violations.push({
          rule: 'resource-leak',
          severity: 'warning',
          message: 'Stream created without .close(), .destroy(), or pipeline — may leak file descriptors',
          file,
          line,
          snippet: lines[line - 1]?.trim(),
        });
      }
    }

    // JS/TS: new Database / createConnection without close
    const connPatterns = [
      { regex: /new\s+Database\s*\(/g, closer: /\.close\(\)/ },
      { regex: /createConnection\s*\(/g, closer: /\.(?:close|end|destroy)\(\)/ },
      { regex: /createPool\s*\(/g, closer: /\.(?:end|destroy)\(\)/ },
    ];

    for (const { regex, closer } of connPatterns) {
      while ((match = regex.exec(content)) !== null) {
        if (!closer.test(content)) {
          const line = content.slice(0, match.index).split('\n').length;
          violations.push({
            rule: 'resource-leak',
            severity: 'warning',
            message: `Resource opened with ${match[0].trim()} but no close/cleanup found in file`,
            file,
            line,
            snippet: lines[line - 1]?.trim(),
          });
        }
      }
    }

    // Python: open() without 'with' statement
    const ext = file.split('.').pop() ?? '';
    if (ext === 'py') {
      const openPattern = /(?<!with\s.*)(?<!\w)open\s*\(/g;
      while ((match = openPattern.exec(content)) !== null) {
        const line = content.slice(0, match.index).split('\n').length;
        const currentLine = lines[line - 1] ?? '';
        if (!currentLine.includes('with ') && !currentLine.includes('.close()')) {
          violations.push({
            rule: 'resource-leak',
            severity: 'warning',
            message: 'open() without context manager (with statement) — file handle may leak',
            file,
            line,
            snippet: currentLine.trim(),
          });
        }
      }
    }

    return violations;
  },
};
