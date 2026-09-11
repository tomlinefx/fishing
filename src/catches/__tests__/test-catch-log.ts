// 画面テスト用: 本物の CatchLog をフェイクの保存層と固定の時計・ID で組み立てる。
import type { Catch } from '../log/catch';
import { createCatchLog, type CatchLog } from '../log/catch-log';
import type { Logger } from '../log/logger';
import { createFakeCatchStore, type FakeCatchStore } from './fake-catch-store';
import { FIXED_NOW } from './fixtures';

export type TestCatchLog = {
  readonly log: CatchLog;
  readonly store: FakeCatchStore;
  readonly logger: Logger & { readonly errors: string[]; readonly warnings: string[] };
};

export function createTestCatchLog(initialRows: readonly Catch[] = []): TestCatchLog {
  const store = createFakeCatchStore(initialRows);
  const errors: string[] = [];
  const warnings: string[] = [];
  const logger = {
    errors,
    warnings,
    warn: (message: string) => {
      warnings.push(message);
    },
    error: (message: string) => {
      errors.push(message);
    },
  };
  let counter = 0;
  const log = createCatchLog({
    store,
    clock: () => FIXED_NOW,
    idGenerator: () => {
      counter += 1;
      return `test-id-${counter}`;
    },
    logger,
  });
  return { log, store, logger };
}
