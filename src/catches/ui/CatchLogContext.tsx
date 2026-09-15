// 画面が CatchLog に到達するための React コンテキスト。画面は CatchStore を直接呼ばない（ADR-002）。
import { createContext, useContext, type ReactNode } from 'react';
import type { CatchLog } from '../log/catch-log';

const CatchLogContext = createContext<CatchLog | null>(null);

export function CatchLogProvider({ log, children }: { log: CatchLog; children: ReactNode }) {
  return <CatchLogContext.Provider value={log}>{children}</CatchLogContext.Provider>;
}

export function useCatchLog(): CatchLog {
  const log = useContext(CatchLogContext);
  if (log === null) {
    throw new Error('useCatchLog は CatchLogProvider の内側で呼ぶ必要があります');
  }
  return log;
}
