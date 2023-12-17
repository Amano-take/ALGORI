// ゲームステータス
export enum StatusGame {
  NEW = 'new', // 新規
  STARTING = 'starting', // 試合中
  FINISH = 'finish', // 試合終了
}

// 記号カードの種類
export enum Special {
  SKIP = 'skip', // スキップ
  REVERSE = 'reverse', // リバース
  DRAW_2 = 'draw_2', // ドロー2
  WILD = 'wild', // ワイルド
  WILD_DRAW_4 = 'wild_draw_4', // ワイルドドロー4
  WILD_SHUFFLE = 'wild_shuffle', //シャッフルワイルド
  WHITE_WILD = 'white_wild', // 白いワイルド
}

// カードの色
export enum Color {
  RED = 'red', // 赤
  YELLOW = 'yellow', // 黄
  GREEN = 'green', // 緑
  BLUE = 'blue', // 青
  BLACK = 'black', // 黒
  WHITE = 'white', // 白
}

// 白いワイルドの効果
export enum WhiteWild {
  BIND_2 = 'bind_2', // バインド2
  SKIP_BIND_2 = 'skip_bind_2', // スキップバインド2
}

// カードを引く理由
export enum DrawReason {
  DRAW_2 = 'draw_2', // ドロー2
  WILD_DRAW_4 = 'wild_draw_4', // ワイルドドロー4
  BIND_2 = 'bind_2', // 白いワイルド（バインド2）
  SKIP_BIND_2 = 'skip_bind_2', // 白いワイルド（スキップバインド2）
  NOTHING = 'nothing', // 理由なし・プレイヤー判断
}

// カードの色一覧
export const ARR_COLOR = [
  Color.RED,
  Color.YELLOW,
  Color.GREEN,
  Color.BLUE,
  Color.BLACK,
  Color.WHITE,
];

// 数字カードの数字一覧
export const ARR_NUMBER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// 記号カードの種類一覧
export const ARR_SPECIAL = [
  Special.SKIP,
  Special.REVERSE,
  Special.DRAW_2,
  Special.WILD,
  Special.WILD_DRAW_4,
  Special.WILD_SHUFFLE,
  Special.WHITE_WILD,
];

// 色変更で指定できる色
export const ARR_COLOR_OF_WILD = [Color.RED, Color.YELLOW, Color.GREEN, Color.BLUE];

// 場札の色に関係なく出せる記号カードの種類
export const ARR_WILD_SPECIAL = [
  Special.WILD,
  Special.WILD_DRAW_4,
  Special.WILD_SHUFFLE,
  Special.WHITE_WILD,
];

// カードの型
export interface Card {
  color: Color | string; // 色
  number?: number; // 数字
  special?: Special | string; // 記号
}

// ゲーム情報の型
export interface Desk {
  id: string; // ゲームID（実質ディーラーコード）
  dealer: string; // ディーラー名
  players: string[]; // 参加プレイヤーリスト
  status: StatusGame; // ゲームステータス
  whiteWild?: WhiteWild; //白いワイルドの種類
  drawDesk: Card[]; // 山札
  revealDesk: Card[]; // 場札
  turn: number; // 対戦数
  totalTurn: number; // 総対戦数
  firstPlayer: string; // 現在の対戦の最初のプレイヤー
  beforePlayer: string; // 前のプレイヤー
  nextPlayer: string; // 次のプレイヤー
  turnRight: boolean; // 右回りか
  cardOfPlayer: {
    [key: string]: Card[]; // プレイヤーの手札
  };
  beforeCardPlay: Card; // 場札の一番上
  isSkip: boolean; // 次のプレイヤーをスキップするか
  cardAddOn: number; // 次のプレイヤーが山札から引く枚数
  mustCallDrawCard: boolean; // 次のプレイヤーは山札からカードを引かないと行けない状況か
  cardBeforeWildDraw4?: Card; // 場札に出されたワイルドドロー4の前のカード
  colorBeforeWild?: Color | string; // 色変更を行うカードが出される前の場札の色
  canCallPlayDrawCard: boolean; // 引いたカードが場に出せるカードであるか
  cardBeforeDrawCard?: Card; // 直前に山札から引いたカード（play-draw-cardが実行された時に場札になるカード）
  activationWhiteWild?: {
    [key: string]: number; // 白いワイルドの効果を受ける残回数
  };
  order: {
    [key: string]: number; // 勝数
  };
  score: {
    [key: string]: number; // 総得点
  };
  yellUno: {
    [key: string]: boolean; // UNO宣言状態
  };
  timeout: {
    [key: string]: boolean; // タイムアウト管理（trueの時はタイムアウトが有効）
  };
  numberTurnPlay: number; // 現在の対戦の総ターン数
  numberCardPlay: number; // 現在の対戦の場に出たカード数
  noPlayCount: number; // 盤面に動きがなかった回数
  specialLogic?: {
    [key: string]: number; // スペシャルロジックの発動回数
  };
  restrictInterrupt?: boolean; // 割り込み処理をブロックするか（trueの時は割り込めない）
  hasYellUnoPenalty?: {
    [key: string]: boolean; // 現在のターンでUNO宣言漏れによりペナルティを受けたか（trueの場合、後続のpointed-not-say-unoの処理を行わない）
  };
}
