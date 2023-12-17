/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
/**
 * ALGORI Javascript版 デモプレイヤー
 */

const socketIoClient = require('socket.io-client');
const BlueBird = require('bluebird');

/**
 * 定数
 */
// Socket通信の全イベント名
const SocketConst = {
  EMIT: {
    JOIN_ROOM: 'join-room', // 試合参加
    RECEIVER_CARD: 'receiver-card', // カードの配布
    FIRST_PLAYER: 'first-player', // 対戦開始
    COLOR_OF_WILD: 'color-of-wild', // 場札の色を変更する
    UPDATE_COLOR: 'update-color', // 場札の色が変更された
    SHUFFLE_WILD: 'shuffle-wild', // シャッフルしたカードの配布
    NEXT_PLAYER: 'next-player', // 自分の手番
    PLAY_CARD: 'play-card', // カードを出す
    DRAW_CARD: 'draw-card', // カードを山札から引く
    PLAY_DRAW_CARD: 'play-draw-card', // 山札から引いたカードを出す
    CHALLENGE: 'challenge', // チャレンジ
    PUBLIC_CARD: 'public-card', // 手札の公開
    POINTED_NOT_SAY_UNO: 'pointed-not-say-uno', // UNO宣言漏れの指摘
    SPECIAL_LOGIC: 'special-logic', // スペシャルロジック
    FINISH_TURN: 'finish-turn', // 対戦終了
    FINISH_GAME: 'finish-game', // 試合終了
    PENALTY: 'penalty', // ペナルティ
  },
};

// UNOのカードの色
const Color = {
  RED: 'red', // 赤
  YELLOW: 'yellow', // 黄
  GREEN: 'green', // 緑
  BLUE: 'blue', // 青
  BLACK: 'black', // 黒
  WHITE: 'white', // 白
};

// UNOの記号カード種類
const Special = {
  SKIP: 'skip', // スキップ
  REVERSE: 'reverse', // リバース
  DRAW_2: 'draw_2', // ドロー2
  WILD: 'wild', // ワイルド
  WILD_DRAW_4: 'wild_draw_4', // ワイルドドロー4
  WILD_SHUFFLE: 'wild_shuffle', // シャッフルワイルド
  WHITE_WILD: 'white_wild', // 白いワイルド
};

// カードを引く理由
const DrawReason = {
  DRAW_2: 'draw_2', // 直前のプレイヤーがドロー2を出した場合
  WILD_DRAW_4: 'wild_draw_4', // 直前のプレイヤーがワイルドドロー4を出した場合
  BIND_2: 'bind_2', // 直前のプレイヤーが白いワイルド（バインド2）を出した場合
  SKIP_BIND_2: 'skip_bind_2', // 直前のプレイヤーが白いワイルド（スキップバインド2）を出した場合
  NOTHING: 'nothing', // 理由なし
};

const TEST_TOOL_HOST_PORT = '3000'; // 開発ガイドラインツールのポート番号
const ARR_COLOR = [Color.RED, Color.YELLOW, Color.BLUE, Color.GREEN]; // 色変更の選択肢

/**
 * コマンドラインから受け取った変数等
 */
const host = process.argv[2] || ''; // 接続先（ディーラープログラム or 開発ガイドラインツール）
const roomName = process.argv[3] || ''; // ディーラー名
const player = process.argv[4] || ''; // プレイヤー名
const eventName = process.argv[5]; // Socket通信イベント名
const isTestTool = host.includes(TEST_TOOL_HOST_PORT); // 接続先が開発ガイドラインツールであるかを判定
const SPECIAL_LOGIC_TITLE = '◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯'; // スペシャルロジック名
const TIME_DELAY = 10; // 処理停止時間

let id = ''; // 自分のID
let unoDeclared = {}; // 他のプレイヤーのUNO宣言状況

/**
 * コマンドライン引数のチェック
 */
if (!host) {
  // 接続先のhostが指定されていない場合はプロセスを終了する
  console.log('Host missed');
  process.exit();
} else {
  console.log(`Host: ${host}`);
}

// ディーラー名とプレイヤー名の指定があることをチェックする
if (!roomName || !player) {
  console.log('Arguments invalid');
  if (!isTestTool) {
    // 接続先がディーラープログラムの場合はプロセスを終了する
    process.exit();
  }
} else {
  console.log(`Dealer: ${roomName}, Player: ${player}`);
}

// 開発ガイドラインツールSTEP1で送信するサンプルデータ
const TEST_TOOL_EVENT_DATA = {
  [SocketConst.EMIT.JOIN_ROOM]: {
    player,
    room_name: roomName,
  },
  [SocketConst.EMIT.COLOR_OF_WILD]: {
    color_of_wild: 'red',
  },
  [SocketConst.EMIT.PLAY_CARD]: {
    card_play: { color: 'black', special: 'wild' },
    yell_uno: false,
    color_of_wild: 'blue',
  },
  [SocketConst.EMIT.DRAW_CARD]: {},
  [SocketConst.EMIT.PLAY_DRAW_CARD]: {
    is_play_card: true,
    yell_uno: true,
    color_of_wild: 'blue',
  },
  [SocketConst.EMIT.CHALLENGE]: {
    is_challenge: true,
  },
  [SocketConst.EMIT.POINTED_NOT_SAY_UNO]: {
    target: 'Player 1',
  },
  [SocketConst.EMIT.SPECIAL_LOGIC]: {
    title: SPECIAL_LOGIC_TITLE,
  },
};

// Socketクライアント
const client = socketIoClient.connect(host, {
  transports: ['websocket'],
});

/**
 * 出すカードを選出する
 * @param cards 自分の手札
 * @param beforeCard 場札のカード
 */
function selectPlayCard(cards, beforeCard) {
  let cardsWild = []; // ワイルド・シャッフルワイルド・白いワイルドを格納
  let cardsWild4 = []; // ワイルドドロー4を格納
  let cardsValid = []; // 同じ色 または 同じ数字・記号 のカードを格納

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
 * @param num 最大値
 * @returns
 */
function randomByNumber(num) {
  return Math.floor(Math.random() * num);
}

/**
 * 変更する色を選出する
 */
function selectChangeColor() {
  // このプログラムでは変更する色をランダムで選択する。
  return ARR_COLOR[randomByNumber(ARR_COLOR.length)];
}

/**
 * チャンレンジするかを決定する
 */
function isChallenge() {
  // このプログラムでは1/2の確率でチャレンジを行う。
  return !!randomByNumber(2);
}

/**
 * 他のプレイヤーのUNO宣言漏れをチェックする
 * @param numberCardOfPlayer
 */
async function determineIfExecutePointedNotSayUno(numberCardOfPlayer) {
  let target;
  // 手札の枚数が1枚だけのプレイヤーを抽出する
  // 2枚以上所持しているプレイヤーはUNO宣言の状態をリセットする
  for (const [k, v] of Object.entries(numberCardOfPlayer)) {
    if (k === id) {
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
 * @param event Socket通信イベント名
 * @param data 送信するデータ
 * @param callback 個別処理
 */
function sendEvent(event, data, callback) {
  console.log(`Send ${event} event.`);
  console.log(`req_data: ${JSON.stringify(data)}`);

  client.emit(event, data, (err, res) => {
    if (err) {
      // エラーをキャッチした場合ログを記録
      console.log(`Client ${event} failed!`);
      console.error(err);
      return;
    }

    console.log(`Client ${event} successfully!`);
    console.log(`res_data: ${JSON.stringify(res)}`);

    if (callback) {
      callback(res);
    }
  });
}

/**
 * 受信イベント共通処理
 * @param event Socket通信イベント名
 * @param data 受信するデータ
 * @param callback 個別処理
 */
function receiveEvent(event, data, callback) {
  console.log(`Receive ${event} event.`);
  console.log(`res_data: ${JSON.stringify(data)}`);

  // 個別処理の指定がある場合は実行する
  if (callback) {
    callback();
  }
}

// プロセス起動時の処理。接続先によって振る舞いが異なる。
if (isTestTool) {
  // テストツールに接続
  if (!eventName) {
    // イベント名の指定がない（開発ガイドラインSTEP2の受信のテストを行う時）
    console.log('Not found event name.');
  } else if (!TEST_TOOL_EVENT_DATA[eventName]) {
    // イベント名の指定があり、テストデータが定義されていない場合はエラー
    console.log(`Undefined test data. eventName: ${eventName}`);
  } else {
    // イベント名の指定があり、テストデータが定義されている場合は送信する(開発ガイドラインSTEP1の送信のテストを行う時)
    sendEvent(eventName, TEST_TOOL_EVENT_DATA[eventName]);
  }
} else {
  // ディーラープログラムに接続
  const data = {
    room_name: roomName,
    player,
  };

  // 試合に参加するイベントを実行
  sendEvent(SocketConst.EMIT.JOIN_ROOM, data, (res) => {
    console.log(`join-room res: ${JSON.stringify(res)}`);
    id = res.your_id;
    console.log(`My id is ${id}`);
  });
}

/**
 * Socket通信の確立
 */
client.on('connect', () => {
  console.log('Client connect successfully!');
});

/**
 * Socket通信を切断
 */
client.on('disconnect', (dataRes) => {
  console.log('Client disconnect.');
  console.log(dataRes);
  // プロセスを終了する
  process.exit();
});

/**
 * Socket通信受信
 */
// プレイヤーがゲームに参加
client.on(SocketConst.EMIT.JOIN_ROOM, (dataRes) => {
  receiveEvent(SocketConst.EMIT.JOIN_ROOM, dataRes);
});

// カードが手札に追加された
client.on(SocketConst.EMIT.RECEIVER_CARD, (dataRes) => {
  receiveEvent(SocketConst.EMIT.RECEIVER_CARD, dataRes);
});

// 対戦の開始
client.on(SocketConst.EMIT.FIRST_PLAYER, (dataRes) => {
  receiveEvent(SocketConst.EMIT.FIRST_PLAYER, dataRes);
});

// 場札の色指定を要求
client.on(SocketConst.EMIT.COLOR_OF_WILD, (dataRes) => {
  receiveEvent(SocketConst.EMIT.COLOR_OF_WILD, dataRes, () => {
    const color = selectChangeColor();
    const data = {
      color_of_wild: color,
    };

    sendEvent(SocketConst.EMIT.COLOR_OF_WILD, data);
  });
});

// 場札の色が変わった
client.on(SocketConst.EMIT.UPDATE_COLOR, (dataRes) => {
  receiveEvent(SocketConst.EMIT.UPDATE_COLOR, dataRes);
});

// シャッフルワイルドにより手札状況が変更
client.on(SocketConst.EMIT.SHUFFLE_WILD, (dataRes) => {
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
client.on(SocketConst.EMIT.NEXT_PLAYER, (dataRes) => {
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

    // スペシャルロジックを発動させる
    const specialLogicNumRundom = randomByNumber(10); // 1/10で発動するように調整
    if (specialLogicNumRundom === 0) {
      sendEvent(SocketConst.EMIT.SPECIAL_LOGIC, { title: SPECIAL_LOGIC_TITLE });
    }

    const playCard = selectPlayCard(cards, dataRes.card_before);
    if (playCard) {
      // 選出したカードがある時
      console.log(`selected card: ${JSON.stringify(playCard)}`);
      const data = {
        card_play: playCard,
        yell_uno: cards.length === 2, // 残り手札数を考慮してUNOコールを宣言する
      };

      // 出すカードがワイルドとワイルドドロー4の時は変更する色を指定する
      if (playCard.special === Special.WILD || playCard.special === Special.WILD_DRAW_4) {
        const color = selectChangeColor(); // 指定する色
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
        const data = {
          is_play_card: true,
          yell_uno: cards.concat(res.draw_card).length === 2, // 残り手札数を考慮してUNOコールを宣言する
        };

        const playCard = res.draw_card[0]; // 引いたカード。draw-cardイベントのcallbackデータは引いたカードのリスト形式であるため、配列の先頭を指定する。
        // 引いたカードがワイルドとワイルドドロー4の時は変更する色を指定する
        if (playCard.special === Special.WILD || playCard.special === Special.WILD_DRAW_4) {
          const color = selectChangeColor();
          data.color_of_wild = color;
        }

        // 引いたカードを出すイベントを実行
        sendEvent(SocketConst.EMIT.PLAY_DRAW_CARD, data);
      });
    }
  });
});

// カードが場に出た
client.on(SocketConst.EMIT.PLAY_CARD, (dataRes) => {
  receiveEvent(SocketConst.EMIT.PLAY_CARD, dataRes, () => {
    // UNO宣言を行った場合は記録する
    if (dataRes.yell_uno) {
      unoDeclared[dataRes.player] = true;
    }
  });
});

// 山札からカードを引いた
client.on(SocketConst.EMIT.DRAW_CARD, (dataRes) => {
  receiveEvent(SocketConst.EMIT.DRAW_CARD, dataRes, () => {
    // カードが増えているのでUNO宣言の状態をリセットする
    delete unoDeclared[dataRes.player];
  });
});

// 山札から引いたカードが場に出た
client.on(SocketConst.EMIT.PLAY_DRAW_CARD, (dataRes) => {
  receiveEvent(SocketConst.EMIT.PLAY_DRAW_CARD, dataRes, () => {
    // UNO宣言を行った場合は記録する
    if (dataRes.yell_uno) {
      unoDeclared[dataRes.player] = true;
    }
  });
});

// チャレンジの結果
client.on(SocketConst.EMIT.CHALLENGE, (dataRes) => {
  receiveEvent(SocketConst.EMIT.CHALLENGE, dataRes);
});

// チャレンジによる手札の公開
client.on(SocketConst.EMIT.PUBLIC_CARD, (dataRes) => {
  receiveEvent(SocketConst.EMIT.PUBLIC_CARD, dataRes);
});

// UNOコールを忘れていることを指摘
client.on(SocketConst.EMIT.POINTED_NOT_SAY_UNO, (dataRes) => {
  receiveEvent(SocketConst.EMIT.POINTED_NOT_SAY_UNO, dataRes);
});

// 対戦が終了
client.on(SocketConst.EMIT.FINISH_TURN, (dataRes) => {
  receiveEvent(SocketConst.EMIT.FINISH_TURN, dataRes, () => {
    // 新しい対戦が始まるのでUNO宣言の状態をリセットする
    unoDeclared = {};
  });
});

// 試合が終了
client.on(SocketConst.EMIT.FINISH_GAME, (dataRes) => {
  receiveEvent(SocketConst.EMIT.FINISH_GAME, dataRes);
});

// ペナルティ発生
client.on(SocketConst.EMIT.PENALTY, (dataRes) => {
  receiveEvent(SocketConst.EMIT.PENALTY, dataRes, () => {
    // カードが増えているのでUNO宣言の状態をリセットする
    delete unoDeclared[dataRes.player];
  });
});
