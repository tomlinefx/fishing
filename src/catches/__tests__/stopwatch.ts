// 性能テスト用のストップウォッチ。
// React Native の Jest 環境では performance.now が Date.now に置き換わっており、
// 単調増加が保証されない（実測でマイナス値が出た）ため、Node の単調時計を使う。

/** 計測を始め、呼ぶと開始からの経過ミリ秒を返す関数を返す。 */
export function startStopwatch(): () => number {
  const startedAt = process.hrtime.bigint();
  return () => Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}
