/**
 * 補欠プレイヤー
 */

import * as socketIoClient from 'socket.io-client';
import * as BlueBird from 'bluebird';
import { Color, DrawReason, Special, Card } from './consts/app.enum';
import {
  CallbackDrawCard,
  CallbackJoinRoom,
  EmitChallenge,
  EmitColorOfWild,
  EmitDrawCard,
  EmitFinishGame,
  EmitFinishTurn,
  EmitFirstPlayer,
  EmitJoinRoom,
  EmitNextPlayer,
  EmitPenalty,
  EmitPlayCard,
  EmitPlayDrawCard,
  EmitPointedNotSayUno,
  EmitPublicCard,
  EmitReceiverCard,
  EmitShuffleWild,
  EmitUpdateColor,
  OnChallenge,
  OnColorOfWild,
  OnDrawCard,
  OnJoinRoom,
  OnPlayCard,
  OnPlayDrawCard,
  OnPointedNotSayUno,
  SocketConst,
} from './consts/socket.const';
import { getLogger } from '../libs/commons';

type CallbackWithData<T> = (data?: T) => void;
type ResponseData =
  | EmitChallenge
  | EmitColorOfWild
  | EmitDrawCard
  | EmitFinishGame
  | EmitFinishTurn
  | EmitFirstPlayer
  | EmitJoinRoom
  | EmitNextPlayer
  | EmitPenalty
  | EmitPenalty
  | EmitPlayCard
  | EmitPlayDrawCard
  | EmitPointedNotSayUno
  | EmitPublicCard
  | EmitReceiverCard
  | EmitShuffleWild
  | EmitUpdateColor
  | EmitUpdateColor;
type RequestData =
  | OnChallenge
  | OnColorOfWild
  | OnDrawCard
  | OnJoinRoom
  | OnPlayCard
  | OnPlayDrawCard
  | OnPointedNotSayUno;
type CallbackData = CallbackDrawCard | CallbackJoinRoom;

/**
 * コマンドラインから受け取った変数等
 */
const host = process.argv[2] || ''; // 接続先
const roomName = process.argv[3] || ''; // ディーラー名
const player = process.argv[4] || ''; // プレイヤー名
const TIME_DELAY = 10; // 処理停止時間
const ARR_COLOR = [Color.RED, Color.YELLOW, Color.GREEN, Color.BLUE]; // 色変更の選択肢

let gameId = ''; // 試合ID
let myId = ''; // 自分のID
let unoDeclared = {}; // 他のプレイヤーのUNO宣言状況

/**
 * ログ記録
 */
function recordLog(level: string, message: string) {
  // 試合参加前は試合のID及び自分のプレイヤーコードが確定しないのでno-player-id.logに書き出す
  const fileName = myId ? `${gameId}-${myId}` : 'no-player-id';
  switch (level) {
    case 'error':
      getLogger('player', fileName).error(message);
      break;
    case 'info':
      getLogger('player', fileName).info(message);
      break;
    case 'warn':
      getLogger('player', fileName).warn(message);
      break;
    case 'debug':
    default:
      getLogger('player', fileName).debug(message);
      break;
  }
}

/**
 * コマンドライン引数のチェック
 */
if (!host) {
  // 接続先のhostが指定されていない場合はプロセスを終了する
  recordLog('error', 'Host missed');
  process.exit();
} else {
  recordLog('info', `Host: ${host}`);
}

// ディーラー名とプレイヤー名の指定があることをチェックする
if (!roomName || !player) {
  recordLog('error', 'Arguments invalid');
  process.exit();
} else {
  recordLog('info', `Dealer: ${roomName}, Player: ${player}`);
}

// Socketクライアント
const client = socketIoClient.connect(host, {
  transports: ['websocket'],
});

/**
 * 出すカードを選出する
 * @param {Card[]} cards 自分の手札
 * @param {Card} beforeCard 場札のカード
 * @returns {Card | undefined}
 */
function selectPlayCard(cards: Card[], beforeCard: Card): Card | undefined {
  const cardsWild = []; // ワイルド・シャッフルワイルド・白いワイルドを格納
  const cardsWild4 = []; // ワイルドドロー4を格納
  const cardsValid = []; // 同じ色 または 同じ数字・記号 のカードを格納

  // 場札と照らし合わせ出せるカードを抽出する
  for (const card of cards) {
    // ワイルドドロー4は場札に関係なく出せる
    if (String(card.special) === Special.WILD_DRAW_4) {
      cardsWild4.push(card);
    } else if (
      String(card.special) === Special.WILD ||
      String(card.special) === Special.WILD_SHUFFLE ||
      String(card.special) === Special.WHITE_WILD
    ) {
      // ワイルド・シャッフルワイルド・白いワイルドも場札に関係なく出せる
      cardsWild.push(card);
    } else if (String(card.color) === String(beforeCard.color)) {
      // 場札と同じ色のカード
      cardsValid.push(card);
    } else if (
      (card.special && String(card.special) === String(beforeCard.special)) ||
      ((card.number || Number(card.number) === 0) &&
        Number(card.number) === Number(beforeCard.number))
    ) {
      // 場札と数字または記号が同じカード
      cardsValid.push(card);
    }
  }

  /**
   * 出せるカードのリストを結合し、先頭のカードを返却する。
   * このプログラムでは優先順位を、「同じ色 または 同じ数字・記号」 > 「ワイルド・シャッフルワイルド・白いワイルド」 > ワイルドドロー4の順番とする。
   * ワイルドドロー4は本来、手札に出せるカードが無い時に出していいカードであるため、一番優先順位を低くする。
   * ワイルド・シャッフルワイルド・白いワイルドはいつでも出せるので、条件が揃わないと出せない「同じ色 または 同じ数字・記号」のカードより優先度を低くする。
   */
  return cardsValid.concat(cardsWild).concat(cardsWild4)[0];
}

/**
 * 乱数取得
 * @param {number} num 最大値
 * @returns {number} 0〜最大値までの整数
 */
function randomByNumber(num: number): number {
  return Math.floor(Math.random() * num);
}

/**
 * 変更する色を選出する
 * @returns {Color} 指定する色
 */
function selectChangeColor(): Color {
  // このプログラムでは変更する色をランダムで選択する。
  return ARR_COLOR[randomByNumber(ARR_COLOR.length)];
}

/**
 * チャンレンジするかを決定する
 * @returns {boolean} 結果
 */
function isChallenge(): boolean {
  // このプログラムでは1/2の確率でチャレンジを行う。
  return !!randomByNumber(2);
}

/**
 * 他のプレイヤーのUNO宣言漏れをチェックする
 * @param {{ [key: string]: number }} numberCardOfPlayer 全プレイヤーの手札所持数
 */
async function determineIfExecutePointedNotSayUno(numberCardOfPlayer: { [key: string]: number }) {
  let target: string;
  // 手札の枚数が1枚だけのプレイヤーを抽出する
  // 2枚以上所持しているプレイヤーはUNO宣言の状態をリセットする
  for (const [k, v] of Object.entries(numberCardOfPlayer)) {
    if (k === myId) {
      // 自分のIDは処理しない
      break;
    } else if (v === 1) {
      // 1枚だけ所持しているプレイヤー
      target = k;
      break;
    } else if (Object.keys(unoDeclared).indexOf(k) > -1) {
      // 2枚以上所持しているプレイヤーはUNO宣言の状態をリセットする
      delete unoDeclared[k];
    }
  }

  if (!target) {
    // 1枚だけ所持しているプレイヤーがいない場合、処理を中断する
    return;
  }

  // 抽出したプレイヤーがUNO宣言を行っていない場合宣言漏れを指摘する
  if (Object.keys(unoDeclared).indexOf(target) === -1) {
    sendEvent(SocketConst.EMIT.POINTED_NOT_SAY_UNO, { target });
    await BlueBird.delay(TIME_DELAY);
  }
}

/**
 * 送信イベント共通処理
 * @param {string} event Socket通信イベント名
 * @param {RequestData} data 送信するデータ
 * @param {CallbackWithData<any>} callback 個別処理
 */
function sendEvent(event: string, data: RequestData, callback?: CallbackWithData<any>) {
  recordLog('info', `Send ${event} event. req_data: ${JSON.stringify(data)}`);

  client.emit(event, data, (err, res: CallbackData) => {
    if (err) {
      recordLog('error', `Client ${event} failed! ${err.toString()}`);
      return;
    }

    recordLog('info', `Client ${event} successfully! res_data: ${JSON.stringify(res)}`);

    if (callback) {
      callback(res);
    }
  });
}

/**
 * 受信イベント共通処理
 * @param {string} event Socket通信イベント名
 * @param {ResponseData} data 受信するデータ
 * @param {CallbackWithData<any>} callback 個別処理
 */
function receiveEvent(event: string, data: ResponseData, callback?: CallbackWithData<any>) {
  recordLog('info', `Receive ${event} event. res_data: ${JSON.stringify(data)}`);

  if (callback) {
    callback();
  }
}

const data: OnJoinRoom = {
  room_name: roomName,
  player,
};

sendEvent(SocketConst.EMIT.JOIN_ROOM, data, (res) => {
  recordLog('info', `join-room res: ${JSON.stringify(res)}`);
  gameId = res.game_id;
  myId = res.your_id;
  recordLog('info', `This game id is ${gameId}`);
  recordLog('info', `My id is ${myId}`);
});

/**
 * Socket通信の確立
 */
client.on('connect', () => {
  recordLog('info', 'Client connect successfully!');
});

/**
 * Socket通信を切断
 */
client.on('disconnect', (dataRes: string) => {
  recordLog('info', `Client disconnect. data_res: ${dataRes}`);
  // プロセスを終了する
  process.exit();
});

/**
 * Socket通信受信
 */
// プレイヤーがゲームに参加
client.on(SocketConst.EMIT.JOIN_ROOM, (dataRes: EmitJoinRoom) => {
  receiveEvent(SocketConst.EMIT.JOIN_ROOM, dataRes);
});

// カードが手札に追加された
client.on(SocketConst.EMIT.RECEIVER_CARD, (dataRes: EmitReceiverCard) => {
  receiveEvent(SocketConst.EMIT.RECEIVER_CARD, dataRes);
});

// 対戦の開始
client.on(SocketConst.EMIT.FIRST_PLAYER, (dataRes: EmitFirstPlayer) => {
  receiveEvent(SocketConst.EMIT.FIRST_PLAYER, dataRes);
});

// 場札の色指定を要求
client.on(SocketConst.EMIT.COLOR_OF_WILD, (dataRes: EmitColorOfWild) => {
  receiveEvent(SocketConst.EMIT.COLOR_OF_WILD, dataRes, () => {
    const color = selectChangeColor();
    const data: OnColorOfWild = {
      color_of_wild: color,
    };

    sendEvent(SocketConst.EMIT.COLOR_OF_WILD, data);
  });
});

// 場札の色が変わった
client.on(SocketConst.EMIT.UPDATE_COLOR, (dataRes: EmitUpdateColor) => {
  receiveEvent(SocketConst.EMIT.UPDATE_COLOR, dataRes);
});

// シャッフルワイルドにより手札状況が変更
client.on(SocketConst.EMIT.SHUFFLE_WILD, (dataRes: EmitShuffleWild) => {
  receiveEvent(SocketConst.EMIT.SHUFFLE_WILD, dataRes),
    () => {
      Object.keys(dataRes.number_card_of_player).forEach((player) => {
        if (dataRes.number_card_of_player[player] === 1) {
          // シャッフル後に1枚になったプレイヤーはUNO宣言を行ったこととする
          unoDeclared[player] = true;
        } else {
          // シャッフル後に2枚以上のカードが配られたプレイヤーはUNO宣言の状態をリセットする
          delete unoDeclared[player];
        }
      });
    };
});

// 自分の番
client.on(SocketConst.EMIT.NEXT_PLAYER, (dataRes: EmitNextPlayer) => {
  receiveEvent(SocketConst.EMIT.NEXT_PLAYER, dataRes, async () => {
    // UNO宣言が漏れているプレイヤーがいないかチェックする。
    // 該当するプレイヤーがいる場合は指摘する。
    await determineIfExecutePointedNotSayUno(dataRes.number_card_of_player);

    const cards = dataRes.card_of_player;

    if (dataRes.draw_reason === DrawReason.WILD_DRAW_4) {
      // カードを引く理由がワイルドドロー4の時、チャレンジを行うことができる。
      if (isChallenge()) {
        sendEvent(SocketConst.EMIT.CHALLENGE, { is_challenge: true });
        return;
      }
    }

    if (dataRes.must_call_draw_card) {
      // 引かなければいけない場合
      sendEvent(SocketConst.EMIT.DRAW_CARD, {});
      return;
    }

    const playCard = selectPlayCard(cards, dataRes.card_before);
    if (playCard) {
      // 選出したカードがある時
      recordLog('debug', `selected card: ${JSON.stringify(playCard)}`);
      const data: OnPlayCard = {
        card_play: playCard,
        yell_uno: cards.length === 2, // 残り手札数を考慮してUNOコールを宣言する
      };

      if (playCard.special === Special.WILD || playCard.special === Special.WILD_DRAW_4) {
        const color = selectChangeColor();
        data.color_of_wild = color;
      }

      // カードを出すイベントを実行
      sendEvent(SocketConst.EMIT.PLAY_CARD, data);
    } else {
      // 選出したカードが無かった時

      // カードを引くイベントを実行
      sendEvent(SocketConst.EMIT.DRAW_CARD, {}, (res) => {
        if (!res.can_play_draw_card) {
          // 引いたカードが場に出せないので処理を終了
          return;
        }

        // 以後、引いたカードが場に出せるときの処理
        const data: OnPlayDrawCard = {
          is_play_card: true,
          yell_uno: cards.concat(res.draw_card).length === 2, // 残り手札数を考慮してUNOコールを宣言する
        };

        const playCard = res.draw_card[0]; // 引いたカード。draw-cardイベントのcallbackデータは引いたカードのリスト形式であるため、配列の先頭を指定する。
        // 引いたカードがワイルドとワイルドドロー4の時は変更する色を指定する
        if (playCard.special === Special.WILD || playCard.special === Special.WILD_DRAW_4) {
          const color = selectChangeColor(); // 指定する色
          data.color_of_wild = color;
        }

        // 引いたカードを出すイベントを実行
        sendEvent(SocketConst.EMIT.PLAY_DRAW_CARD, data);
      });
    }
  });
});

// カードが場に出た
client.on(SocketConst.EMIT.PLAY_CARD, (dataRes: EmitPlayCard) => {
  receiveEvent(SocketConst.EMIT.PLAY_CARD, dataRes, () => {
    // UNO宣言を行った場合は記録する
    if (dataRes.yell_uno) {
      unoDeclared[dataRes.player] = true;
    }
  });
});

// 山札からカードを引いた
client.on(SocketConst.EMIT.DRAW_CARD, (dataRes: EmitDrawCard) => {
  receiveEvent(SocketConst.EMIT.DRAW_CARD, dataRes, () => {
    // カードが増えているのでUNO宣言の状態をリセットする
    delete unoDeclared[dataRes.player];
  });
});

// 山札から引いたカードが場に出た
client.on(SocketConst.EMIT.PLAY_DRAW_CARD, (dataRes: EmitPlayDrawCard) => {
  receiveEvent(SocketConst.EMIT.PLAY_DRAW_CARD, dataRes, () => {
    // UNO宣言を行った場合は記録する
    if (dataRes.yell_uno) {
      unoDeclared[dataRes.player] = true;
    }
  });
});

// チャレンジの結果
client.on(SocketConst.EMIT.CHALLENGE, (dataRes: EmitChallenge) => {
  receiveEvent(SocketConst.EMIT.CHALLENGE, dataRes);
});

// チャレンジによる手札の公開
client.on(SocketConst.EMIT.PUBLIC_CARD, (dataRes: EmitPublicCard) => {
  receiveEvent(SocketConst.EMIT.PUBLIC_CARD, dataRes);
});

// UNOコールを忘れていることを指摘
client.on(SocketConst.EMIT.POINTED_NOT_SAY_UNO, (dataRes: EmitPointedNotSayUno) => {
  receiveEvent(SocketConst.EMIT.POINTED_NOT_SAY_UNO, dataRes);
});

// 対戦が終了
client.on(SocketConst.EMIT.FINISH_TURN, (dataRes: EmitFinishTurn) => {
  receiveEvent(SocketConst.EMIT.FINISH_TURN, dataRes, () => {
    // 新しい対戦が始まるのでUNO宣言の状態をリセットする
    unoDeclared = {};
  });
});

// 試合が終了
client.on(SocketConst.EMIT.FINISH_GAME, (dataRes: EmitFinishGame) => {
  receiveEvent(SocketConst.EMIT.FINISH_GAME, dataRes);
});

// ペナルティ発生
client.on(SocketConst.EMIT.PENALTY, (dataRes: EmitPenalty) => {
  receiveEvent(SocketConst.EMIT.PENALTY, dataRes, () => {
    // カードが増えているのでUNO宣言の状態をリセットする
    delete unoDeclared[dataRes.player];
  });
});
