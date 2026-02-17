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
];
