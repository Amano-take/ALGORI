import { Card, Color, DrawReason, WhiteWild } from './app.enum';

// socket通信のイベント種類
export class SocketConst {
  static readonly EMIT = {
    JOIN_ROOM: 'join-room', // 試合に参加
    RECEIVER_CARD: 'receiver-card', // カードの配布
    FIRST_PLAYER: 'first-player', // 試合開始
    COLOR_OF_WILD: 'color-of-wild', // 変更する色の指定（player -> dealer）
    UPDATE_COLOR: 'update-color', // 場札の色変更（dealer -> all player）
    SHUFFLE_WILD: 'shuffle-wild', // シャッフルワイルドによるカードシャッフル
    NEXT_PLAYER: 'next-player', // 次の手番を通知
    PLAY_CARD: 'play-card', // カードを出す
    DRAW_CARD: 'draw-card', // カードを引く
    PLAY_DRAW_CARD: 'play-draw-card', // 引いたカードを出す
    CHALLENGE: 'challenge', // チャレンジ
    PUBLIC_CARD: 'public-card', // 手札の公開
    POINTED_NOT_SAY_UNO: 'pointed-not-say-uno', // UNO宣言指摘漏れ
    SPECIAL_LOGIC: 'special-logic', // スペシャルロジック
    FINISH_TURN: 'finish-turn', // 対戦終了
    FINISH_GAME: 'finish-game', // 試合終了
    PENALTY: 'penalty', // ペナルティ
  };
}

// join-room 受信データ型
export interface OnJoinRoom {
  room_name: string; // ディーラー名
  player: string; // プレイヤー名
}

// color-of-wild 受信データ型
export interface OnColorOfWild {
  color_of_wild: Color; // 指定する色
}

// play-card 受信データ型
export interface OnPlayCard {
  card_play: Card; // 場に出すカード
  yell_uno: boolean; // UNO宣言を行うか
  color_of_wild?: Color; // 色変更を伴うカードで指定する色
}

// draw-card 受信データ型
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OnDrawCard {}

// play-draw-card 受信データ型
export interface OnPlayDrawCard {
  is_play_card: boolean; // 直前に引いたカードを場に出すか
  yell_uno: boolean; // UNO宣言を行うか
  color_of_wild?: Color; // 色変更を伴うカードで指定する色
}

// challenge 受信データ型
export interface OnChallenge {
  is_challenge: boolean; // チャレンジを行うか
}

// pointed-not-say-uno 受信データ型
export interface OnPointedNotSayUno {
  target: string; // UNO宣言漏れを指摘するプレイヤーコード
}

// special-logic 受信データ型
export interface OnSpecialLogic {
  title: string; // スペシャルロジック名称
}

// join-room 送信データ型
export interface EmitJoinRoom {
  room_name: string; // ディーラー名
  player: string; // プレイヤー名
}

// first-player 送信データ型
export interface EmitFirstPlayer {
  first_player: string; // 最初の順番のプレイヤーコード
  first_card: string; // 山札から引いた最初のカード
  play_order: string[]; // 順番
}

// receiver-card 送信データ型
export interface EmitReceiverCard {
  cards_receive: Card[]; // 配布されたカードリスト
  is_penalty: boolean; // ペナルティとして配布したか
}

// color-of-wild 送信データ型
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmitColorOfWild {}

// update-color 送信データ型
export interface EmitUpdateColor {
  color: Color; // 指定する色
}

// shuffle-wild 送信データ型
export interface EmitShuffleWild {
  cards_receive: Card[]; // 配布されたカードリスト
  number_card_of_player: {
    [key: string]: number; // プレイヤーの手札数
  };
}

// next-player 送信データ型
export interface EmitNextPlayer {
  next_player: string; // 次の順番のプレイヤーコード
  before_player: string; // 前の順番のプレイヤーコード
  card_before: Card; // 場札のカード
  card_of_player: Card[]; // 所持しているカード
  must_call_draw_card: boolean; // draw-card イベントを強制させるか
  draw_reason: DrawReason; // カードを引かなければならない理由
  turn_right: boolean; // 右回りであるか
  number_card_play: number; // 今対戦中に場札に出されたカードの合計枚数
  number_turn_play: number; // 今対戦中のターン数
  number_card_of_player: {
    [key: string]: number; // プレイヤーの手札数
  };
}

// play-card 送信データ型
export interface EmitPlayCard {
  player: string; // カード出したプレイヤーコード
  card_play: Card; // 場に出したカード
  yell_uno: boolean; // UNO宣言をしたか
  color_of_wild?: Color; // 変更した色
}

// draw-card 送信データ型
export interface EmitDrawCard {
  player: string; // カード引いたプレイヤーコード
  is_draw: boolean; // カードを引いたか
}

// play-draw-card 送信データ型
export interface EmitPlayDrawCard {
  player: string; // カード出したプレイヤーコード
  is_play_card: boolean; // カードを場に出したか
  card_play?: Card; // 場に出したカード
  yell_uno?: boolean; // UNO宣言を行うか
  color_of_wild?: Color; // 色変更を伴うカードで指定する色
}

// challenge 送信データ型
export interface EmitChallenge {
  challenger: string; // チャレンジを行ったプレイヤーコード
  target: string; // ワイルドドロー4を出したプレイヤーコード
  is_challenge: boolean; // チャレンジを行ったか
  is_challenge_success?: boolean; // チャレンジを成功したか
}

// public-card 送信データ型
export interface EmitPublicCard {
  card_of_player: string; // 手札を公開するプレイヤーコード
  cards: Card[]; // 公開する手札リスト
}

// pointed-not-say-uno 送信データ型
export interface EmitPointedNotSayUno {
  pointer: string; // 指摘したプレイヤーのプレイヤーコード
  target: string; // 指摘されたプレイヤープレイヤーコード
  have_say_uno: boolean; // UNO宣言があったか
}

// finish-turn 送信データ型
export interface EmitFinishTurn {
  turn_no: number; // 対戦数
  winner: string; // 勝者のプレイヤーコード
  score: {
    [key: string]: number; // 得点
  };
}

// finish-game 送信データ型
export interface EmitFinishGame {
  winner: string; // 総合勝者のプレイヤーコード
  turn_win: number; // 対戦数
  order: {
    [key: string]: number; // 勝数
  };
  score: {
    [key: string]: number; // 得点
  };
}

// penalty 送信データ型
export interface EmitPenalty {
  player: string; // ペナルティを受けるプレイヤーコード
  number_card_of_player: number; // カード追加後の合計手札枚数
  error: string; // ペナルティの原因
}

// join-room コールバックデータ型
export interface CallbackJoinRoom extends EmitJoinRoom {
  game_id: string; // ディーラーコード
  your_id: boolean; // プレイヤーコード
  total_turn: number; // 総対戦数
  white_wild: WhiteWild; // 白いワイルドの効果
}

// draw-card コールバックデータ型
export interface CallbackDrawCard extends EmitDrawCard {
  can_play_draw_card: boolean; // 手札からカードを場札に出すことができるか
  draw_card?: Card[]; // 山札から引いたカードリスト
}
