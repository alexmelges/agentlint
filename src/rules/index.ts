import type { LintRule } from '../types.js';
import { hardcodedPaths } from './hardcoded-paths.js';
import { hardcodedUrls } from './hardcoded-urls.js';
import { missingErrorHandling } from './missing-error-handling.js';
import { credentialLeak } from './credential-leak.js';
import { consoleLog } from './console-log.js';
import { noPagination } from './no-pagination.js';
import { noInputValidation } from './no-input-validation.js';
import { noRetry } from './no-retry.js';
import { todoFixme } from './todo-fixme.js';
import { syncFs } from './sync-fs.js';
import { magicNumbers } from './magic-numbers.js';
import { emptyCatch } from './empty-catch.js';
import { anyType } from './any-type.js';
import { noTimeout } from './no-timeout.js';
import { unsafeEval } from './unsafe-eval.js';
import { unboundedLoop } from './unbounded-loop.js';
import { missingTypes } from './missing-types.js';
import { sqlInjection } from './sql-injection.js';
import { overlyPermissive } from './overly-permissive.js';
import { resourceLeak } from './resource-leak.js';
// Go rules
import { goErrorIgnored } from './go-error-ignored.js';
import { goDeferInLoop } from './go-defer-in-loop.js';
import { goGoroutineLeak } from './go-goroutine-leak.js';
import { goNilCheckMissing } from './go-nil-check-missing.js';
import { goBareReturn } from './go-bare-return.js';
import { goInitFunction } from './go-init-function.js';
// Rust rules
import { rustUnwrap } from './rust-unwrap.js';
import { rustUnsafeBlock } from './rust-unsafe-block.js';
import { rustCloneHeavy } from './rust-clone-heavy.js';
import { rustTodoMacro } from './rust-todo-macro.js';
import { rustPanic } from './rust-panic.js';

export const allRules: LintRule[] = [
  hardcodedPaths,
  hardcodedUrls,
  missingErrorHandling,
  credentialLeak,
  consoleLog,
  noPagination,
  noInputValidation,
  noRetry,
  todoFixme,
  syncFs,
  magicNumbers,
  emptyCatch,
  anyType,
  noTimeout,
  unsafeEval,
  unboundedLoop,
  missingTypes,
  sqlInjection,
  overlyPermissive,
  resourceLeak,
  // Go rules
  goErrorIgnored,
  goDeferInLoop,
  goGoroutineLeak,
  goNilCheckMissing,
  goBareReturn,
  goInitFunction,
  // Rust rules
  rustUnwrap,
  rustUnsafeBlock,
  rustCloneHeavy,
  rustTodoMacro,
  rustPanic,
];
