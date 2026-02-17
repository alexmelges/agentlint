export type Severity = 'error' | 'warning' | 'info';

export interface LintViolation {
  rule: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column?: number;
  snippet?: string;
}

export interface LintRule {
  name: string;
  description: string;
  severity: Severity;
  languages: string[];
  check(file: string, content: string, lines: string[]): LintViolation[];
}

export interface LintResult {
  violations: LintViolation[];
  filesScanned: number;
  rulesApplied: number;
  durationMs: number;
}

export interface LintConfig {
  rules?: Record<string, Severity | 'off'>;
  ignore?: string[];
  extensions?: string[];
}
