// 釣果（Catch）の型。データの形の源泉は functional-design/entities.md。

/** 保存済みの釣果1件。id と caughtAt は保存時に自動付与され、以後変更しない（BR1.5、BR1.6）。 */
export type Catch = {
  readonly id: string;
  /** アプリ専用領域内の写真原本のパス（必須） */
  readonly photoPath: string;
  /** アプリ専用領域内の縮小版のパス（必須。原本と常に対で存在する） */
  readonly thumbnailPath: string;
  /** 魚種。未入力は null */
  readonly species: string | null;
  /** サイズ（cm、小数第1位まで）。未入力は null */
  readonly sizeCm: number | null;
  /** 重さ（g、整数）。未入力は null */
  readonly weightG: number | null;
  /** 場所。未入力は null */
  readonly placeName: string | null;
  /** 保存した瞬間の端末時刻 */
  readonly caughtAt: Date;
};

/** 登録画面（S2）からの入力。数値項目も文字列のまま受け取り、検証で数値に変換する。 */
export type CatchInput = {
  /** 端末上の一時的な写真の参照。未添付は null */
  readonly photoUri: string | null;
  readonly species: string;
  readonly sizeCm: string;
  readonly weightG: string;
  readonly placeName: string;
};

/** 一覧の絞り込み条件（BR2.2）。指定した項目は完全一致で絞る。 */
export type CatchFilter = {
  readonly species?: string;
  readonly placeName?: string;
};

/** 絞り込みチップの候補（BR2.3） */
export type FilterOptions = {
  readonly species: readonly string[];
  readonly places: readonly string[];
};
