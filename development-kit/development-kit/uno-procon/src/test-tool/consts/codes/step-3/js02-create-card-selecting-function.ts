export default `
const socketIoClient = require('socket.io-client');

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

const host = process.argv[2] || ''; // 接続先（ディーラープログラム or 開発ガイドラインツール）
const roomName = process.argv[3] || ''; // ディーラー名
const player = process.argv[4] || ''; // プレイヤー名
const eventName = process.argv[5]; // Socket通信イベント名 追加
const isTestTool = host.includes(TEST_TOOL_HOST_PORT); // 接続先が開発ガイドラインツールであるかを判定

let id = ''; // 自分のID

/**
 * コマンドライン引数のチェック
 */
if (!host) {
  // 接続先のhostが指定されていない場合はプロセスを終了する
  console.log('Host missed');
  process.exit();
} else {
  console.log(\`Host: \${host}\`);
}

// ディーラー名とプレイヤー名の指定があることをチェックする
if (!roomName || !player) {
  console.log('Arguments invalid');
  if (!isTestTool) {
    // 接続先がディーラープログラムの場合はプロセスを終了する
    process.exit();
  }
} else {
  console.log(\`Dealer: \${roomName}, Player: \${player}\`);
}

// 開発ガイドラインツールSTEP1で送信するサンプルデータ
const TEST_TOOL_EVENT_DATA = {
  // TODO テストデータを定義してください。
  /** サンプル ここから */
  [SocketConst.EMIT.JOIN_ROOM]: {
    player,
    room_name: roomName,
  }
  /** サンプル ここまで */
};

// Socketクライアント
const client = socketIoClient.connect(host, {
  transports: ['websocket'],
});

/** 追加 ここから */
/**
 * 出すカードを選出する
 * @param cards 自分の手札
 * @param beforeCard 場札のカード
 */
function selectPlayCard(cards, beforeCard) {
  // TODO カードを選択するロジックをご自身で自由に実装してください。
}
/** 追加 ここまで */

/**
 * 送信イベント共通処理
 * @param event Socket通信イベント名
 * @param data 送信するデータ
 * @param callback 個別処理
 */
function sendEvent(event, data, callback) {
  console.log(\`Send \${event} event.\`);
  console.log(\`req_data: \${JSON.stringify(data)}\`);

  client.emit(event, data, (err, res) => {
    if (err) {
      // エラーをキャッチした場合ログを記録
      console.log(\`Client \${event} failed!\`);
      console.error(err);
      return;
    }

    console.log(\`Client \${event} successfully!\`);
    console.log(\`res_data: \${JSON.stringify(res)}\`);

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
  console.log(\`Receive \${event} event.\`);
  console.log(\`res_data: \${JSON.stringify(data)}\`);

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
    console.log(\`Undefined test data. eventName: \${eventName}\`);
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
    console.log(\`join-room res: \${JSON.stringify(res)}\`);
    id = res.your_id;
    console.log(\`My id is \${id}\`);
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

// TODO 受信する全てのイベントの処理を記述してください。
// プレイヤーがゲームに参加
client.on(SocketConst.EMIT.JOIN_ROOM, (dataRes) => {
  receiveEvent(SocketConst.EMIT.JOIN_ROOM, dataRes);
});

/** 前STEPで実装済み ここから */
// 自分の番
client.on(SocketConst.EMIT.NEXT_PLAYER, (dataRes) => {
  /** 変更 ここから */
  receiveEvent(SocketConst.EMIT.NEXT_PLAYER, dataRes, () => {
    const cards = dataRes.card_of_player;

    const playCard = selectPlayCard(cards, dataRes.card_before);
    console.log(\`selected card: \${JSON.stringify(playCard)}\`);

    const data = {
      card_play: playCard,
      yell_uno: cards.length === 2, // 残り手札数を考慮してUNOコールを宣言する
    };

    // TODO 色の指定が必要なときは、色の宣言をする。後で実装する。
    // カードを出すイベントを実行
    sendEvent(SocketConst.EMIT.PLAY_CARD, data);
  });
  /** 変更 ここまで */
});
/** 前STEPで実装済み ここまで */

// （中略）各イベントの受信機能
`;
