// 記録用のロガーの型。既定は console。失敗を握りつぶさず、少なくとも記録するために使う。
export type Logger = {
  warn(message: string, detail?: unknown): void;
  error(message: string, detail?: unknown): void;
};

export const consoleLogger: Logger = {
  warn: (message, detail) => console.warn(message, detail),
  error: (message, detail) => console.error(message, detail),
};
