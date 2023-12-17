/**
 * @description config socket.io
 * @ref https://socket.io/docs/emit-cheatsheet/
 */
import * as BlueBird from 'bluebird';
import { uniq, remove, cloneDeep } from 'lodash';
import Queue from 'queue';
import * as SocketIO from 'socket.io';
import * as redisAdapter from 'socket.io-redis';

import { DealerService } from '../api/dealer/dealer.service';
import { PlayerService } from '../api/player/player.service';
import { ActivityService } from '../api/activity/activity.service';
import { AppConst } from './consts/app.const';
import { AppObject } from './consts/app.object';
import {
  ARR_COLOR_OF_WILD,
  Card,
  Color,
  Desk,
  StatusGame,
  Special,
  WhiteWild,
} from './consts/app.enum';
import {
  OnJoinRoom,
  OnColorOfWild,
  OnPlayCard,
  OnChallenge,
  OnPointedNotSayUno,
  OnPlayDrawCard,
  OnSpecialLogic,
  SocketConst,
  EmitDrawCard,
  EmitChallenge,
  EmitPointedNotSayUno,
  CallbackDrawCard,
  EmitPlayCard,
  EmitPlayDrawCard,
  EmitPublicCard,
} from './consts/socket.const';
import { CommonService } from './common.service';
import { SocketService } from './socket-io.service';
import APP_CONFIG from '../configs/app.config';
import redisClient from '../configs/database/redis.config';
import { Environment, getLogger } from '../libs/commons';
import { BaseError } from '../libs/standard';

// Socket通信のセットアップ
SocketService.io.adapter(
  redisAdapter({
    host: APP_CONFIG.ENV.DATABASE.REDIS.HOST,
    port: APP_CONFIG.ENV.DATABASE.REDIS.PORT,
  }),
);
const socketServer = SocketService.io.of('/');
socketServer.use(SocketService.handlePlayer);

// 各サービスの生成
const activityService = new ActivityService();
const dealerService = new DealerService();
const playerService = new PlayerService();

type CallbackWithData<T> = (err: any, data: T) => void;

// queueのセットアップ
const queue = Queue({ autostart: true, concurrency: 1 });

/**
 * 次のプレイヤーに順番を回す処理
 * @param {Desk} desk ゲーム情報
 * @param {boolean} isChallenge チャレンジを行ったか
 * @param {boolean} isChallengeSuccessfully チャレンジが成功したか
 * @returns
 */
async function nextPlayerAction(
  desk: Desk,
  isChallenge?: boolean,
  isChallengeSuccessfully?: boolean,
) {
  let nextPlayer: string, beforeCard: Card, mustCallDrawCard: boolean, numberTurnPlay: number;
  if (isChallenge === undefined) {
    // challengeイベントではない時の処理
    const nextPlayerInfo = await CommonService.getNextPlayer(desk.id);
    nextPlayer = nextPlayerInfo.nextPlayer;
    beforeCard = nextPlayerInfo.beforeCard;
    mustCallDrawCard = nextPlayerInfo.mustCallDrawCard;
    numberTurnPlay = nextPlayerInfo.numberTurnPlay;
  } else {
    // challengeイベントの時の処理
    if (isChallenge) {
      // チャレンジを行った時
      if (isChallengeSuccessfully) {
        // チャレンジが成功した場合、現在のプレイヤーの手番が続行するので、nextPlayerを書き換えず現在の情報のまま。
        nextPlayer = desk.nextPlayer;
        beforeCard = desk.beforeCardPlay;
        mustCallDrawCard = desk.mustCallDrawCard;
        numberTurnPlay = desk.numberTurnPlay;
        await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));
      } else {
        // チャレンジが失敗した場合、次のプレイヤーの手番になるので、順番を次に回す。
        const nextPlayerInfo = await CommonService.getNextPlayer(desk.id);
        nextPlayer = nextPlayerInfo.nextPlayer;
        beforeCard = nextPlayerInfo.beforeCard;
        mustCallDrawCard = nextPlayerInfo.mustCallDrawCard;
        numberTurnPlay = nextPlayerInfo.numberTurnPlay;
      }
    } else {
      // チャレンジを行わなかった時場合、引き続き現在のプレイヤーの手番であるため、何も処理を行わない。
      return;
    }
  }

  const socketIdOfNextPlayer = await redisClient.get(
    `${AppObject.REDIS_PREFIX.PLAYER}:${nextPlayer}`,
  );

  // ゲームログ出力: next-player
  await activityService.create({
    dealer_code: desk.id,
    event: SocketConst.EMIT.NEXT_PLAYER,
    dealer: desk.dealer,
    player: '',
    turn: desk.turn,
    contents: {
      next_player: nextPlayer,
      before_player: desk.beforePlayer,
      card_before: beforeCard,
      card_of_player: desk.cardOfPlayer[nextPlayer],
      turn_right: desk.turnRight,
      must_call_draw_card: String(mustCallDrawCard) === 'true',
      draw_reason: CommonService.getDrawReason(desk, nextPlayer),
      number_card_play: desk.numberCardPlay,
      number_turn_play: numberTurnPlay,
      number_card_of_player: CommonService.getCardCountOfPlayers(desk),
    },
    desk: CommonService.deskLog(desk),
  } as any);

  // 次の順番のプレイヤーに通知
  SocketService.sendNextPlayer(socketIdOfNextPlayer, {
    next_player: nextPlayer,
    before_player: desk.beforePlayer,
    card_before: beforeCard,
    card_of_player: desk.cardOfPlayer[nextPlayer],
    must_call_draw_card: mustCallDrawCard,
    draw_reason: CommonService.getDrawReason(desk, nextPlayer),
    turn_right: desk.turnRight,
    number_card_play: desk.numberCardPlay,
    number_turn_play: desk.numberTurnPlay,
    number_card_of_player: CommonService.getCardCountOfPlayers(desk),
  });

  return;
}

/**
 * カードの効果を処理する
 * @param {SocketIO.Socket} socket カードを出したプレイヤーのsocket情報
 * @param {Desk} desk ゲーム情報
 * @param {string} player // カード出したプレイヤーのコード
 * @param {Card} cardPlay // 場に出したカード
 * @param {Card} beforeCardPlay // 現在の場札
 */
async function playCardAction(
  socket: SocketIO.Socket,
  desk: Desk,
  player: string,
  cardPlay: Card,
  beforeCardPlay: Card,
) {
  getLogger('dealer', `${desk.id}`).debug(
    `Play card action. turn: ${desk.turn}, numberTurnPlay: ${desk.numberTurnPlay}`,
  );

  switch (cardPlay.special as Special) {
    case Special.WILD_SHUFFLE: {
      // 場に出したカードがシャッフルワイルドの時

      // カードを出したプレイヤーの手札が0枚になった時は、再配布の対象からは除外する
      const ignorePlayer = !desk.cardOfPlayer[player].length ? player : null;
      const shuffleWildData = CommonService.shuffleWild(desk, ignorePlayer); // 手札をシャッフル
      desk = shuffleWildData.desk; // シャッフル後のゲーム情報で上書き
      getLogger('dealer', `${desk.id}`).debug(`cardOfPlayer: ${JSON.stringify(desk.cardOfPlayer)}`);
      desk.cardAddOn = 0;
      desk.restrictInterrupt = true;
      // シャッフル後の手札を各プレイヤーに通知
      for (const player of shuffleWildData.playersReceiveCard) {
        const socketId = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${player}`);
        // シャッフルしたことで手札の枚数が1枚になったプレイヤーに対して、UNO宣言漏れの判定をくださないようにUNO宣言を行ったこととする。
        desk.yellUno[player] = desk.cardOfPlayer[player].length === 1;
        SocketService.sendCardShuffleWild(socketId, {
          cards_receive: desk.cardOfPlayer[player],
          number_card_of_player: CommonService.getCardCountOfPlayers(desk),
        });
      }

      // ゲームログの出力: shuffle-wild
      await activityService.create({
        dealer_code: desk.id,
        event: SocketConst.EMIT.SHUFFLE_WILD,
        dealer: desk.dealer,
        player: '',
        turn: desk.turn,
        contents: {
          player,
          cards_receive: desk.cardOfPlayer,
          number_turn_play: desk.numberTurnPlay,
        },
        desk: CommonService.deskLog(desk),
      } as any);

      desk.timeout[player] = true; // 色指定を行わせるため、タイムアウトを再設定する
      await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

      // 色指定のためのタイムアウト処理を設定（テスト時は設定しない）
      if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
        const timeout = setTimeout(
          CommonService.timeoutColorOfWild,
          AppConst.TIMEOUT_OF_PLAYER,
          desk.id,
          player,
        );
        (<any>global)[player] = timeout;
      }

      // 色指定をの要求をプレイヤーに通知する
      await SocketService.sendChoseColorOfWild(socket.id);

      // ゲームログの出力: color-change-request
      await activityService.create({
        dealer_code: desk.id,
        event: 'color-change-request',
        dealer: desk.dealer,
        player: '',
        turn: desk.turn,
        contents: {
          player,
          number_turn_play: desk.numberTurnPlay,
        },
        desk: CommonService.deskLog(desk),
      } as any);
      break;
    }
    case Special.WHITE_WILD: {
      // 場に出したカードが白いワイルドの時

      switch (desk.whiteWild) {
        case WhiteWild.BIND_2: {
          // 白いワイルドの効果がバインド2の場合
          const { nextPlayer } = CommonService.preGetNextPlayer(desk);
          desk.mustCallDrawCard = true; // 次のプレイヤーは強制的にカードを引くことになる
          if (!desk.activationWhiteWild) {
            // 白いワイルドの効果回数管理フィールドが存在しない場合、生成する
            desk.activationWhiteWild = {};
          }
          // バインド2の効果回数を加算
          desk.activationWhiteWild[nextPlayer] = (desk.activationWhiteWild[nextPlayer] || 0) + 2;
          // 場札を更新 TODO: このタイミングで必要なのか要確認
          desk.beforeCardPlay = {
            ...desk.beforeCardPlay,
            color: beforeCardPlay.color,
          };
          break;
        }
        case WhiteWild.SKIP_BIND_2: {
          // 白いワイルドの効果がスキップバインド2の場合
          desk.isSkip = true; // 次のプレイヤーをスキップする
          const { nextPlayer } = CommonService.preGetNextPlayer(desk);
          desk.mustCallDrawCard = true; // 次のプレイヤーは強制的にカードを引くことになる
          if (!desk.activationWhiteWild) {
            // 白いワイルドの効果回数管理フィールドが存在しない場合、生成する
            desk.activationWhiteWild = {};
          }
          // バインド2の効果回数を加算
          desk.activationWhiteWild[nextPlayer] = (desk.activationWhiteWild[nextPlayer] || 0) + 2;
          // 場札を更新 TODO: このタイミングで必要なのか要確認
          desk.beforeCardPlay = {
            ...desk.beforeCardPlay,
            color: beforeCardPlay.color,
          };
          break;
        }
      }

      await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));
      await BlueBird.delay(AppConst.TIMEOUT_DELAY);
      break;
    }
    default: {
      // 場に出したカードがその他の時

      if ((cardPlay.special as Special) === Special.DRAW_2) {
        // ドロー2の場合
        desk.cardAddOn += 2;
        desk.mustCallDrawCard = true;
      }
      if ((cardPlay.special as Special) === Special.REVERSE) {
        // リバースの場合
        desk.turnRight = !desk.turnRight;
      }
      if ((cardPlay.special as Special) === Special.SKIP) {
        // スキップの場合
        desk.isSkip = true;
      }
      // ゲーム情報を更新
      await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));
    }
  }
}

/**
 * 現在のプレイヤーをスキップする
 * @param {SocketIO.Socket} socket socket情報
 * @param {Desk} desk ゲーム情報
 * @param {string} player プレイヤーコード
 * @param {boolean} isColorOfWild // color-of-wildイベントで発生したペナルティか
 */
async function skipPlayer(
  socket: SocketIO.Socket,
  desk: Desk,
  player: string,
  isColorOfWild?: boolean,
) {
  await BlueBird.delay(AppConst.TIMEOUT_DELAY);
  if (desk.mustCallDrawCard) {
    // 現在のプレイヤーがカードを引かないと行けない時、カードを引く処理を実行する
    await handleDrawCard(desk, player, socket);
  } else {
    // 次のプレイヤーに順番を回すので各項目をリセットする
    if (isColorOfWild) {
      // color-of-wildイベントの処理内
      if (desk.beforeCardPlay.color === Color.BLACK) {
        desk.beforeCardPlay = {
          ...desk.beforeCardPlay,
          color: desk.colorBeforeWild || desk.beforeCardPlay.color, // 色変更カードを出す前のカードの色 または その情報が見つからない時は直前のカードの色で上書く
        };
      }
      if ((desk.beforeCardPlay.special as Special) === Special.WILD_DRAW_4) {
        // 場札のカードがワイルドドロー4の場合
        desk.cardAddOn += 4;
        desk.mustCallDrawCard = true;
      } else {
        // 場札のカードがワイルドの場合
        desk.cardAddOn = 0;
        desk.mustCallDrawCard = false;
      }
    }
    desk.beforePlayer = player;
    desk.noPlayCount = 0;
    desk.canCallPlayDrawCard = false;
    desk.timeout[player] = false;
    clearTimeout((<any>global)[player]);

    // ゲーム情報更新
    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));
    await nextPlayerAction(desk);
  }
}

/**
 * ペナルティ処理
 * @param {SocketIO.Socket} socket ペナルティ対象のSocket情報
 * @param {string} player ペナルティ対象のプレイヤーコード
 * @param {Desk} desk ゲーム情報
 * @param {number} penaltyCnt 山札からカードを引く枚数
 * @param {BaseError} error // エラー内容
 * @param {CallbackWithData<any>} callback // コールバック
 * @param {boolean} isNextPlayer // 現在の手番のプレイヤーであるか
 * @param {boolean} isColorOfWild // color-of-wildイベントで発生したペナルティか
 * @returns
 */
async function handlePenalty(
  socket: SocketIO.Socket,
  player: string,
  desk: Desk,
  penaltyCnt: number,
  error: BaseError,
  callback: CallbackWithData<any>,
  isNextPlayer: boolean,
  isColorOfWild?: boolean,
) {
  if (!penaltyCnt) {
    // カードを引く枚数が0の時
    if (isNextPlayer) {
      // ペナルティを受けるのが現在の手番のプレイヤーの場合は権利を失うので、更に次のプレイヤーに順番を回す
      await skipPlayer(socket, desk, player);
    }
    CommonService.handleError(desk.id, error, callback);
    return;
  }

  const { cardOfPlayer } = desk;
  const have = cardOfPlayer[player].length; // 手札の枚数
  const margin = AppConst.MAX_CARD_OF_PLAYER - have; // 所持できる最大枚数と手札数との差
  const count = margin > penaltyCnt ? penaltyCnt : margin; // ペナルティでカードを引くと最大枚数を超える場合は、引く枚数を調整する

  if (!count) {
    // 調整した結果カードが引けなくなった場合
    if (isNextPlayer) {
      // ペナルティを受けるのが現在の手番のプレイヤーの場合は権利を失うので、更に次のプレイヤーに順番を回す
      await skipPlayer(socket, desk, player);
    }
    CommonService.handleError(desk.id, error, callback);
    return;
  }

  const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(desk, count);
  desk.drawDesk = drawDesk;
  desk.revealDesk = revealDesk;
  desk.cardOfPlayer[player] = CommonService.sortCardOfPlayer(
    desk.cardOfPlayer[player].concat(drawCards),
  );
  desk.canCallPlayDrawCard = false;
  desk.yellUno[player] = false; // 手札が増えているのでUNO宣言はリセットする
  desk.restrictInterrupt = false;
  // ゲーム情報を更新
  await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

  // 増えた手札をプレイヤーに通知
  SocketService.sendCardToPlayer(socket.id, { cards_receive: drawCards, is_penalty: true });

  // ゲームログの出力: penalty
  await activityService.create({
    dealer_code: desk.id,
    event: 'penalty',
    dealer: desk.dealer,
    player: '',
    turn: desk.turn,
    contents: {
      player,
      cards_receive: drawCards,
      number_turn_play: desk.numberTurnPlay,
      error: error.message,
    },
    desk: CommonService.deskLog(desk),
  } as any);

  // べナルティが与えられたことを全体に通知
  SocketService.broadcastPenalty(desk.id, {
    player: player,
    number_card_of_player: desk.cardOfPlayer[player].length,
    error: error.message,
  });
  await BlueBird.delay(AppConst.TIMEOUT_DELAY);

  if (drawCards.length < count) {
    // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
    await CommonService.turnEnd(desk);
    CommonService.handleError(desk.id, error, callback);
    return;
  }

  if (isNextPlayer) {
    // ペナルティを受けるのが現在の手番のプレイヤーの場合は権利を失うので、更に次のプレイヤーに順番を回す
    await skipPlayer(socket, desk, player, isColorOfWild);
  }

  CommonService.handleError(desk.id, error, callback);
  return;
}

/**
 * 山札を引いたときの処理
 * @param {Desk} desk ゲーム情報
 * @param {string} player プレイヤーコード
 * @param {SocketIO.Socket} socket socket情報
 * @param {CallbackWithData<any>} callback コールバック
 * @returns
 */
async function handleDrawCard(
  desk: Desk,
  player: string,
  socket: SocketIO.Socket,
  callback?: CallbackWithData<any>,
) {
  const cardOfPlayer = desk.cardOfPlayer[player];
  const hasActivationWhiteWild = desk.activationWhiteWild
    ? desk.activationWhiteWild[player] > 0
    : false; // 白いワイルドの効果適用回数が残っているか
  const needDrawCard = desk.cardAddOn > 0; // カードを引かないといけない枚数（ドロー2, ワイルドドロー4による加算枚数）
  if (
    !hasActivationWhiteWild &&
    !needDrawCard &&
    cardOfPlayer.length >= AppConst.MAX_CARD_OF_PLAYER
  ) {
    // 白いワイルドの効果適用回数が残っておらず かつ
    // 前のプレイヤーの手番によってカードを引く枚数がなく かつ
    // 手札数が所持できる最大枚数を超えている時
    // = カードを引けない

    if (desk.noPlayCount >= AppConst.NO_PLAY_MAX_LAP * desk.players.length) {
      // 盤面に動きがなく限界数を超えた場合は対戦終了
      await CommonService.turnEnd(desk);
      if (callback instanceof Object) {
        callback(undefined, {});
      }
      return;
    }

    desk.beforePlayer = player;
    desk.noPlayCount++; // 盤面に動きがない状態であるため硬直ターン数を加算
    desk.yellUno[player] = false; // 手札数が最大数を超えているので、強制的にUNO宣言はリセット
    desk.timeout[player] = false;
    clearTimeout((<any>global)[player]);
    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

    // ゲームログの出力: draw-card
    const emitData: EmitDrawCard = { player, is_draw: false };
    await activityService.create({
      dealer_code: desk.id,
      event: SocketConst.EMIT.DRAW_CARD,
      dealer: desk.dealer,
      player,
      turn: desk.turn,
      contents: {
        can_play_draw_card: false,
        card_draw: [],
        is_draw: false,
        draw_desk: {
          before: desk.drawDesk.length,
          after: desk.drawDesk.length,
        },
        before_card: desk.cardBeforeDrawCard,
        draw_reason: CommonService.getDrawReason(desk, player),
        number_turn_play: desk.numberTurnPlay,
      },
      desk: CommonService.deskLog(desk),
    } as any);

    SocketService.broadcastDrawCard(desk.id, emitData);

    if (callback instanceof Object) {
      const cbData: CallbackDrawCard = { ...emitData, can_play_draw_card: false };
      callback(undefined, cbData);
    }

    // 次のプレイヤーに手番を回す
    await nextPlayerAction(desk);
    return;
  }

  const numberOfCardsBeforeDrawCard = desk.drawDesk.length; // カードを引く前の山札の枚数
  const activationWhiteWild = desk.activationWhiteWild && desk.activationWhiteWild[player] ? 1 : 0; // 白いワイルドの効果によって引くカードの枚数
  const cardAddOn = desk.cardAddOn || activationWhiteWild;
  const count = cardAddOn || 1; //前のプレイヤーが出したカードによる効果でカードを引く必要が無い場合は、引く枚数を1枚とする

  getLogger('dealer', `${desk.id}`).debug(
    `turn: ${desk.turn}, numberTurnPlay: ${desk.numberTurnPlay}`,
  );

  const drawReason = CommonService.getDrawReason(desk, player); // カードを引く理由
  // カードを引く
  const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(desk, count);
  desk.drawDesk = drawDesk;
  desk.revealDesk = revealDesk;
  if (activationWhiteWild) {
    // 白いワイルドの効果回数がある場合は減少させる
    desk.activationWhiteWild[player]--;
  }
  const cardDraws: Card[] = drawCards;

  const beforeCardPlay = cloneDeep(desk.beforeCardPlay);
  if (
    cardAddOn > 0 ||
    !cardDraws[0] ||
    !CommonService.isAvailableCard(cardDraws[0], beforeCardPlay, desk.cardAddOn)
  ) {
    // 前のプレイヤーの手番によってカードを引く枚数がある または
    // 引いたカードが無い または
    // 場に出せるカードではない
    // = カードを出すことはできない

    // 次のプレイヤーに順番を回すので各項目をリセットする
    desk.cardAddOn = 0;
    desk.mustCallDrawCard = false;
    desk.canCallPlayDrawCard = false;
    desk.beforePlayer = player;
    desk.cardOfPlayer[player] = CommonService.sortCardOfPlayer(
      desk.cardOfPlayer[player].concat(cardDraws),
    );
    desk.noPlayCount = 0; // カードを引くことができたので硬直回数をリセット
    desk.restrictInterrupt = false;
    desk.yellUno[player] = false;
    desk.hasYellUnoPenalty = {};
    desk.timeout[player] = false;
    clearTimeout((<any>global)[player]);
    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

    // ゲームログの出力: draw-card
    const emitData: EmitDrawCard = { player, is_draw: true };
    await activityService.create({
      dealer_code: desk.id,
      event: SocketConst.EMIT.DRAW_CARD,
      dealer: desk.dealer,
      player,
      turn: desk.turn,
      contents: {
        can_play_draw_card: false,
        card_draw: cardDraws,
        is_draw: true,
        draw_desk: {
          before: numberOfCardsBeforeDrawCard,
          after: desk.drawDesk.length,
        },
        before_card: desk.cardBeforeDrawCard,
        draw_reason: drawReason,
        number_turn_play: desk.numberTurnPlay,
      },
      desk: CommonService.deskLog(desk),
    } as any);

    // 手札の追加をプレイヤーに通知
    SocketService.sendCardToPlayer(socket.id, { cards_receive: cardDraws, is_penalty: false });
    await BlueBird.delay(AppConst.TIMEOUT_DELAY);

    // カードを引いたことを全体に通知
    SocketService.broadcastDrawCard(desk.id, emitData);

    // カードを引いたプレイヤーにデータを返却
    const cbData: CallbackDrawCard = {
      ...emitData,
      can_play_draw_card: false,
      draw_card: cardDraws,
    };
    if (drawCards.length < count) {
      // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
      await CommonService.turnEnd(desk);
      if (callback instanceof Object) {
        callback(undefined, cbData);
      }
      return;
    }

    if (callback instanceof Object) {
      callback(undefined, cbData);
    }

    // 引いたカードを出せないので次のプレイヤーに手番を回す
    await nextPlayerAction(desk);
    return;
  }

  // 以降、引いたカードが場に出せる場合の処理

  // 次の処理（play-draw-card待ち）のために各項目をリセット
  desk.mustCallDrawCard = false;
  desk.canCallPlayDrawCard = true; // 場に出せるカードの判定を更新
  desk.cardBeforeDrawCard = cardDraws[0]; // 引いたカードの1枚目を保存する（ここまで到達するのは1枚しか引いてないパターンになる）
  desk.cardOfPlayer[player] = CommonService.sortCardOfPlayer(
    desk.cardOfPlayer[player].concat(cardDraws),
  );
  desk.noPlayCount = 0;
  desk.restrictInterrupt = true; // play-draw-cardの実行を待つので、割り込みを禁止する
  desk.yellUno[player] = false;
  desk.hasYellUnoPenalty = {};
  desk.timeout[player] = true;
  clearTimeout((<any>global)[player]); // 既存タイマーを解除
  if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
    // play-draw-cardイベントの実行を待つための新規タイマーの設定
    const timeout = setTimeout(
      CommonService.timeoutPlayer,
      AppConst.TIMEOUT_OF_PLAYER,
      desk.id,
      player,
    );
    (<any>global)[player] = timeout;
  }
  // ゲーム情報更新
  await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

  // ゲームログの出力: draw-card
  const dataCb: EmitDrawCard = { player, is_draw: true };
  await activityService.create({
    dealer_code: desk.id,
    event: SocketConst.EMIT.DRAW_CARD,
    dealer: desk.dealer,
    player,
    turn: desk.turn,
    contents: {
      can_play_draw_card: true,
      card_draw: cardDraws,
      is_draw: dataCb.is_draw,
      draw_desk: {
        before: numberOfCardsBeforeDrawCard,
        after: desk.drawDesk.length,
      },
      before_card: desk.cardBeforeDrawCard,
      draw_reason: drawReason,
      number_turn_play: desk.numberTurnPlay,
    },
    desk: CommonService.deskLog(desk),
  } as any);

  // 手札の追加をプレイヤーに通知
  SocketService.sendCardToPlayer(socket.id, { cards_receive: cardDraws, is_penalty: false });
  await BlueBird.delay(AppConst.TIMEOUT_DELAY);

  // カードを引いたことを全体に通知
  SocketService.broadcastDrawCard(desk.id, dataCb);

  if (callback instanceof Object) {
    callback(undefined, { ...dataCb, draw_card: cardDraws, can_play_draw_card: true });
  }
  return;
}

socketServer.on('connection', function (socket) {
  /**
   * join-room
   */
  socket.on(
    SocketConst.EMIT.JOIN_ROOM,
    async (data: OnJoinRoom, callback: CallbackWithData<any>) => {
      async function execute() {
        function catchError(error: BaseError) {
          if (callback instanceof Object) {
            callback(error, undefined);
          }
          socket.disconnect(true);
          return;
        }

        // バリデーションチェック
        if (!data.room_name) {
          catchError(new BaseError({ message: AppConst.ROOM_NAME_IS_REQUIRED }));
          return;
        }
        if (!data.player) {
          catchError(new BaseError({ message: AppConst.PLAYER_NAME_IS_REQUIRED }));
          return;
        }
        if (data.player && data.player.length > AppConst.MAX_NAME_LENGTH) {
          catchError(new BaseError({ message: AppConst.PLAYER_NAME_TOO_LONG }));
          return;
        }

        try {
          // ディーラー情報取得
          const dealer = await dealerService.detailByCondition({
            name: data.room_name,
            status: { $ne: StatusGame.FINISH },
          });
          if (!dealer) {
            catchError(new BaseError({ message: AppConst.DEALER_NOT_FOUND }));
            return;
          }

          getLogger('dealer', `${dealer.code}`).info(
            `Event ${SocketConst.EMIT.JOIN_ROOM}. data: ${JSON.stringify(data)}`,
          );

          // プレイヤー名からプレイヤー情報を取得する、見つからなければ新規作成。
          let playerFound = await playerService.detailByCondition({ name: data.player });
          if (!playerFound) {
            playerFound = await playerService.create({
              name: data.player,
            });
            getLogger('dealer', '').info(`Create player. ${JSON.stringify(playerFound)}`);
          }

          const { players } = dealer;
          if (players.indexOf(playerFound.code) > -1) {
            // 既に参加しているプレイヤーと同名の時
            const socketConnection = await redisClient.get(
              `${AppObject.REDIS_PREFIX.PLAYER}:${playerFound.code}`,
            );

            // この試合に既に接続がある場合は、名前重複のエラー
            if (socketConnection) {
              catchError(new BaseError({ message: AppConst.PLAYER_NAME_DUPLICATE }));
              return;
            }
          } else {
            // 参加者が最大人数に到達している場合はエラー
            if (players.length >= AppConst.MAX_PLAYER) {
              catchError(new BaseError({ message: AppConst.DEALER_MAX_PLAYER }));
              return;
            }
          }

          players.push(playerFound.code);
          await dealerService.updateByCondition({
            conditions: { code: dealer.code },
            data: {
              $set: { players: uniq(players) },
            },
          });

          // 各種データをRedisに情報登録
          // socketIdをキーにプレイヤーコードを保存
          await redisClient.set(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`, playerFound.code);
          // プレイヤーコードにsocketIdを紐づけ（時限式）
          await redisClient.set(
            `${AppObject.REDIS_PREFIX.PLAYER}:${playerFound.code}`,
            socket.id,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          );
          // プレイヤーコードとsocketIdで接続しているディーラーコードを紐づけ（時限式）
          await redisClient.set(
            `${AppObject.REDIS_PREFIX.ROOM}:${playerFound.code}:${socket.id}`,
            dealer.code,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          );

          // コマンドログ記録
          CommonService.loggingCommand(socket.id, SocketConst.EMIT.JOIN_ROOM, data);
          socket.join(dealer.code);
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);

          // プレイヤーが試合に参加したことを全体に通知
          SocketService.broadcastJoinRoom(dealer.code, data);

          // ゲームログの出力: join-room
          await activityService.create({
            dealer_code: dealer.code,
            event: SocketConst.EMIT.JOIN_ROOM,
            dealer: dealer.name,
            player: playerFound.code,
            contents: {
              player_code: playerFound.code,
              player_name: data.player,
            },
          } as any);

          // プレイヤーに情報を返却
          if (callback instanceof Object) {
            callback(undefined, {
              ...data,
              game_id: dealer.code,
              your_id: playerFound.code,
              total_turn: dealer.totalTurn,
              white_wild: dealer.whiteWild,
            });
          }

          return;
        } catch (err) {
          const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
          const dealer = await redisClient.get(
            `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
          ); // ディーラーコード
          if (dealer) {
            // ディーラーが見つかる場合は共通エラー処理で、ディラーのログに出力
            CommonService.handleError(dealer, err, callback);
          } else {
            // ディーラーが見つからない場合は管理者ログに出力
            getLogger('admin', '').error(`${err}}`);
          }
        }
      }

      // 逐次処理のためキューに入れる
      queue.push(() => {
        return new Promise<void>((resolve) => {
          execute().then(() => {
            resolve();
          });
        });
      });
    },
  );

  /**
   * color-of-wild
   */
  socket.on(
    SocketConst.EMIT.COLOR_OF_WILD,
    async (data: OnColorOfWild, callback: CallbackWithData<any>) => {
      // コマンドログ記録
      CommonService.loggingCommand(socket.id, SocketConst.EMIT.COLOR_OF_WILD, data);

      async function execute() {
        const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
        const dealerId = await redisClient.get(
          `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
        ); // ディーラーコード
        getLogger('dealer', `${dealerId}`).info(
          `Event ${SocketConst.EMIT.COLOR_OF_WILD}. data: ${JSON.stringify(data)}`,
        );

        try {
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }

          await redisClient.set(
            `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
            socket.id,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          ); // socketIdを延長
          const socketIds: any = (await SocketService.getAllClientOfRoom(dealerId)) || []; // 接続者リスト
          if (CommonService.canContinue(socketIds)) {
            // 接続者数がゲーム継続人数に足りない時は中断する
            const error = new BaseError({
              message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO,
            });
            CommonService.handleError(dealerId, error, callback);
            socket.disconnect(true);
            return;
          }

          const desk: Desk = JSON.parse(
            await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
          ); // ゲーム情報
          const isNextPlayer = CommonService.checkNextPlayer(player, desk.nextPlayer); // 現在のプレイヤーであるかを判定
          if (!isNextPlayer && desk.restrictInterrupt) {
            // 現在のプレイヤーではなく かつ 割り込み処理が禁止されているので後続の処理を行わない
            const error = new BaseError({
              message: AppConst.RESUTRICT_INTERRUPT,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          // ゲームログの出力: color-of-wild
          await activityService.create({
            dealer_code: desk.id,
            event: SocketConst.EMIT.COLOR_OF_WILD,
            dealer: desk.dealer,
            player,
            turn: desk.turn,
            contents: {
              color_of_wild: data.color_of_wild,
              number_turn_play: desk.numberTurnPlay,
            },
            desk: CommonService.deskLog(desk),
          } as any);

          if (!isNextPlayer) {
            // 現在のプレイヤーではないためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.NEXT_PLAYER_INVALID }),
              callback,
              isNextPlayer,
              true,
            );
            return;
          }

          if (desk.beforeCardPlay.color !== Color.BLACK) {
            // 場札の色が「黒」ではないタイミングで実行したためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.ALREADY_CHANGED_COLOR }),
              callback,
              isNextPlayer,
              true,
            );
            return;
          }

          // バリデーションチェック
          if (!data.color_of_wild) {
            // color_of_wildフィールドが足りないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.COLOR_WILD_IS_REQUIRED }),
              callback,
              isNextPlayer,
              true,
            );
            return;
          } else if (ARR_COLOR_OF_WILD.indexOf(data.color_of_wild as Color) === -1) {
            // color_of_wildの値が規定値ではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.COLOR_WILD_INVALID }),
              callback,
              isNextPlayer,
              true,
            );
            return;
          }

          if (
            (desk.beforeCardPlay.special as Special) === Special.WILD_DRAW_4 ||
            ((desk.beforeCardPlay.special as Special) === Special.WILD && desk.numberTurnPlay !== 1)
          ) {
            // 場札がワイルドドロー4である または 場札はワイルドであるが最初のターンではない場合はペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CAN_NOT_CHOSE_COLOR_OF_WILD }),
              callback,
              isNextPlayer,
              true,
            );
            return;
          }

          // 次のプレイヤー順番を回すので各項目をリセット
          desk.beforeCardPlay.color = data.color_of_wild; // 色を上書き
          desk.mustCallDrawCard = false;
          desk.beforePlayer = player;
          desk.noPlayCount = 0;
          desk.restrictInterrupt = false;
          desk.hasYellUnoPenalty = {};
          desk.timeout[player] = false;
          clearTimeout((<any>global)[player]);

          // ゲーム情報を更新
          await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));

          // 場札が更新されたことを全体に通知
          await SocketService.broadcastUpdateColor(dealerId, { color: data.color_of_wild });
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);

          if (CommonService.isTurnEnd(desk, player, undefined, true)) {
            // 対戦が終了した時
            if (desk.beforeCardPlay.special === Special.WILD_DRAW_4) {
              // 出したカードがワイルドドロー4の場合は、次のプレイヤーに効果を与えてから対戦を終了する
              const { nextPlayer } = CommonService.preGetNextPlayer(desk); // 次のプレイヤー情報を更新せずに取得だけ行う
              const numberOfCardsBeforeDrawCard = desk.drawDesk.length;
              const drawReason = CommonService.getDrawReason(desk, nextPlayer);
              const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(
                desk,
                desk.cardAddOn,
              );
              desk.drawDesk = drawDesk;
              desk.revealDesk = revealDesk;
              desk.cardOfPlayer[nextPlayer] = CommonService.sortCardOfPlayer(
                desk.cardOfPlayer[nextPlayer].concat(drawCards),
              );
              desk.cardAddOn = 0;
              desk.mustCallDrawCard = false;
              desk.canCallPlayDrawCard = false;
              desk.cardBeforeDrawCard = undefined;

              // ゲーム情報更新
              await redisClient.set(
                `${AppObject.REDIS_PREFIX.DESK}:${dealerId}`,
                JSON.stringify(desk),
              );

              const emitData: EmitDrawCard = {
                player: nextPlayer,
                is_draw: true,
              };

              // ゲームログの出力: draw-card
              await activityService.create({
                dealer_code: desk.id,
                event: SocketConst.EMIT.DRAW_CARD,
                dealer: desk.dealer,
                player: nextPlayer,
                turn: desk.turn,
                contents: {
                  can_play_draw_card: false,
                  card_draw: drawCards,
                  is_draw: true,
                  draw_desk: {
                    before: numberOfCardsBeforeDrawCard,
                    after: desk.drawDesk.length,
                  },
                  before_card: desk.beforeCardPlay,
                  draw_reason: drawReason,
                  number_turn_play: desk.numberTurnPlay,
                },
                desk: CommonService.deskLog(desk),
              } as any);

              // 手札の追加をプレイヤーに通知
              const socketIdOfNextPlayer = await redisClient.get(
                `${AppObject.REDIS_PREFIX.PLAYER}:${nextPlayer}`,
              );
              SocketService.sendCardToPlayer(socketIdOfNextPlayer, {
                cards_receive: drawCards,
                is_penalty: false,
              });
              await BlueBird.delay(AppConst.TIMEOUT_DELAY);

              // プレイヤーに情報を返却
              SocketService.broadcastDrawCard(dealerId, emitData);
            }

            // 対戦終了処理を実行
            await CommonService.turnEnd(desk, player);

            if (callback instanceof Object) {
              callback(undefined, data);
            }

            return;
          }

          // 次のプレイヤーに順番を回す
          await nextPlayerAction(desk);

          if (callback instanceof Object) {
            callback(undefined, data);
          }

          return;
        } catch (err) {
          CommonService.handleError(dealerId, err, callback);
        }
      }

      // 逐次処理のためキューに入れる
      queue.push(() => {
        return new Promise<void>((resolve) => {
          execute().then(() => {
            resolve();
          });
        });
      });
    },
  );

  /**
   * play-card
   */
  socket.on(
    SocketConst.EMIT.PLAY_CARD,
    async (data: OnPlayCard, callback: CallbackWithData<any>) => {
      // コマンドログ記録
      CommonService.loggingCommand(socket.id, SocketConst.EMIT.PLAY_CARD, data);

      async function execute() {
        const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
        const dealerId = await redisClient.get(
          `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
        ); // ディーラーコード
        getLogger('dealer', `${dealerId}`).info(
          `Event ${SocketConst.EMIT.PLAY_CARD}. data: ${JSON.stringify(data)}`,
        );

        try {
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }
          await redisClient.set(
            `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
            socket.id,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          ); // socketIdを延長
          const socketIds: any = (await SocketService.getAllClientOfRoom(dealerId)) || [];
          if (CommonService.canContinue(socketIds)) {
            // 接続者数がゲーム継続人数に足りない時は中断する
            const error = new BaseError({
              message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO,
            });
            CommonService.handleError(dealerId, error, callback);
            socket.disconnect(true);
            return;
          }

          const cardPlay = data.card_play;
          let desk: Desk = JSON.parse(
            await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
          ); // ゲーム情報
          if (desk.restrictInterrupt) {
            // 割り込み処理が禁止されているので後続の処理を行わない
            const error = new BaseError({
              message: AppConst.RESUTRICT_INTERRUPT,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          // ゲームログの出力: play-card
          const isSkip =
            cardPlay &&
            ((cardPlay.special as Special) === Special.SKIP ||
              ((cardPlay.special as Special) == Special.WHITE_WILD &&
                desk.whiteWild === WhiteWild.SKIP_BIND_2));
          const preGetNextPlayer = CommonService.preGetNextPlayer({
            ...desk,
            beforePlayer: player,
            beforeCardPlay: cardPlay,
            isSkip,
            turnRight:
              cardPlay && (cardPlay.special as Special) === Special.REVERSE
                ? !desk.turnRight
                : desk.turnRight,
          });
          await activityService.create({
            dealer_code: desk.id,
            event: SocketConst.EMIT.PLAY_CARD,
            dealer: desk.dealer,
            player,
            turn: desk.turn,
            contents: {
              card_play: cardPlay,
              number_turn_play: desk.numberTurnPlay,
              next_player: preGetNextPlayer.nextPlayer,
              skip_player: preGetNextPlayer.skipPlayer,
              yell_uno: data.yell_uno,
              color_of_wild: data.color_of_wild,
            },
            desk: CommonService.deskLog(
              {
                ...desk,
                turnRight:
                  data.card_play?.special === Special.REVERSE ? !desk.turnRight : desk.turnRight,
                isSkip,
                yellUno: { ...desk.yellUno, [player]: data.yell_uno },
                revealDesk: [...desk.revealDesk].concat([data.card_play]),
              }, // desk情報更新前に書き出すので部分的に上書きしておく
              { [player]: [cardPlay] },
            ),
          } as any);

          const isNextPlayer = CommonService.checkNextPlayer(player, desk.nextPlayer);
          // 現在のプレイヤーではないためペナルティ
          if (!isNextPlayer) {
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.NEXT_PLAYER_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (desk.mustCallDrawCard) {
            // カードを引かないと行けないタイミングであるためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CAN_NOT_PLAY_CARD }),
              callback,
              isNextPlayer,
            );
            return;
          }

          // バリデーションチェック
          const validateErr = CommonService.hasValidateError(cardPlay);
          if (validateErr) {
            // card_playフィールドのバリデーションエラーであるためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              validateErr,
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.yell_uno === undefined || data.yell_uno === null) {
            // yell_unoフィールドが足りないまたはnullであるためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.YELL_UNO_IS_REQUIED }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (
            String(data.yell_uno) !== AppObject.BOOLEAN.TRUE &&
            String(data.yell_uno) !== AppObject.BOOLEAN.FALSE
          ) {
            // yell_unoフィールドが規定値ではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.PARAM_YELL_UNO_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          let cardOfPlayer = cloneDeep(desk.cardOfPlayer[player]);
          if (!CommonService.validateCardOfPlayer(dealerId, cardPlay, cardOfPlayer)) {
            // 出したカードを所持していないためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CARD_PLAY_NOT_EXIST_OF_PLAYER }),
              callback,
              isNextPlayer,
            );
            return;
          }

          const beforeCardPlay = cloneDeep(desk.beforeCardPlay);
          if (!CommonService.isAvailableCard(cardPlay, beforeCardPlay, desk.cardAddOn)) {
            // 場札に対して出せないカードを出したのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CARD_PLAY_INVALID_WITH_CARD_BEFORE }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (
            ((cardPlay.special as Special) === Special.WILD ||
              (cardPlay.special as Special) === Special.WILD_DRAW_4) &&
            !data.color_of_wild
          ) {
            // 出したカードが色変更を伴うカードだが、color_of_wildフィールドが足りないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.COLOR_WILD_IS_REQUIRED }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.color_of_wild && ARR_COLOR_OF_WILD.indexOf(data.color_of_wild as Color) === -1) {
            // color_of_wildの値が規定値ではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.COLOR_WILD_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.yell_uno && cardOfPlayer.length !== 2) {
            // UNO宣言をしたが、手札が2枚のタイミングではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CAN_NOT_SAY_UNO_AND_PLAY_CARD }),
              callback,
              isNextPlayer,
            );
            return;
          }

          // 次のプレイヤーに手番を回すため、各項目をリセット
          cardOfPlayer = CommonService.removeCardOfPlayer(cardPlay, cardOfPlayer);
          desk.cardOfPlayer[player] = CommonService.sortCardOfPlayer(cardOfPlayer);
          desk.numberCardPlay++;
          desk.revealDesk.push(cardPlay);
          desk.colorBeforeWild = desk.beforeCardPlay.color; // 前のカードの色を保存
          desk.beforeCardPlay = cardPlay;
          if (
            (cardPlay.special as Special) === Special.WILD ||
            (cardPlay.special as Special) === Special.WILD_DRAW_4
          ) {
            desk.beforeCardPlay.color = data.color_of_wild;
          }
          desk.beforePlayer = player;
          if ((desk.beforeCardPlay.special as Special) === Special.WILD_DRAW_4) {
            desk.cardBeforeWildDraw4 = beforeCardPlay;
            desk.cardAddOn += 4;
          } else {
            desk.cardAddOn = 0;
          }
          desk.mustCallDrawCard = false;
          if ((desk.beforeCardPlay.special as Special) === Special.WILD_DRAW_4) {
            desk.mustCallDrawCard = true;
          }
          desk.noPlayCount = 0;
          desk.yellUno[player] = data.yell_uno;
          desk.hasYellUnoPenalty = {};
          desk.timeout[player] = false;
          clearTimeout((<any>global)[player]);

          // ゲーム情報更新
          await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));

          // 出したカードの効果を処理する
          await playCardAction(socket, desk, player, cardPlay, beforeCardPlay);
          desk = JSON.parse(await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`)); // ゲーム情報
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);

          // カードを出したことを全体に通知
          const emitData: EmitPlayCard = {
            ...data,
            player,
          };
          SocketService.broadcastPlayCard(dealerId, emitData);

          if (
            (cardPlay.special as Special) === Special.WILD ||
            (cardPlay.special as Special) === Special.WILD_DRAW_4
          ) {
            // ワイルドまたはワイルドドロー4の場合
            // ゲームログの出力: color-of-wild
            await activityService.create({
              dealer_code: desk.id,
              event: SocketConst.EMIT.COLOR_OF_WILD,
              dealer: desk.dealer,
              player,
              turn: desk.turn,
              contents: {
                color_of_wild: data.card_play.color,
                number_turn_play: desk.numberTurnPlay,
              },
              desk: CommonService.deskLog({
                ...desk,
                beforeCardPlay: { ...desk.beforeCardPlay, color: 'black' }, // desk情報更新済であるため更新前の情報に上書き
              }),
            } as any);
            // 場札の色が変更されたことを全体に通知
            await SocketService.broadcastUpdateColor(desk.id, {
              color: beforeCardPlay.color as Color,
            });
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }

          if (CommonService.isTurnEnd(desk, player, cardPlay)) {
            // 対戦が終了した時
            if (cardPlay.special === Special.DRAW_2) {
              // 出したカードがドロー2の場合は、次のプレイヤーに効果を与えてから対戦を終了する
              // ワイルドドロー4は色の変更が必要であるため、このタイミングでは対戦終了判定にならない。
              const { nextPlayer } = CommonService.preGetNextPlayer(desk); // 次のプレイヤー情報を更新せずに取得だけ行う
              const numberOfCardsBeforeDrawCard = desk.drawDesk.length;
              const drawReason = CommonService.getDrawReason(desk, nextPlayer);
              const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(
                desk,
                desk.cardAddOn,
              );
              desk.drawDesk = drawDesk;
              desk.revealDesk = revealDesk;
              desk.cardOfPlayer[nextPlayer] = CommonService.sortCardOfPlayer(
                desk.cardOfPlayer[nextPlayer].concat(drawCards),
              );
              desk.cardAddOn = 0;
              desk.mustCallDrawCard = false;
              desk.canCallPlayDrawCard = false;
              desk.cardBeforeDrawCard = undefined;

              // ゲーム情報更新
              await redisClient.set(
                `${AppObject.REDIS_PREFIX.DESK}:${dealerId}`,
                JSON.stringify(desk),
              );

              const drawCardData: EmitDrawCard = {
                player: nextPlayer,
                is_draw: true,
              };

              // ゲームログの出力: draw-card
              await activityService.create({
                dealer_code: desk.id,
                event: SocketConst.EMIT.DRAW_CARD,
                dealer: desk.dealer,
                player: nextPlayer,
                turn: desk.turn,
                contents: {
                  can_play_draw_card: false,
                  card_draw: drawCards,
                  is_draw: true,
                  draw_desk: {
                    before: numberOfCardsBeforeDrawCard,
                    after: desk.drawDesk.length,
                  },
                  before_card: desk.beforeCardPlay,
                  draw_reason: drawReason,
                  number_turn_play: desk.numberTurnPlay,
                },
                desk: CommonService.deskLog(desk),
              } as any);

              // 手札の追加をプレイヤーに通知
              const socketIdOfNextPlayer = await redisClient.get(
                `${AppObject.REDIS_PREFIX.PLAYER}:${nextPlayer}`,
              );
              SocketService.sendCardToPlayer(socketIdOfNextPlayer, {
                cards_receive: drawCards,
                is_penalty: false,
              });
              await BlueBird.delay(AppConst.TIMEOUT_DELAY);

              // プレイヤーに情報を返却
              SocketService.broadcastDrawCard(dealerId, drawCardData);
            }

            // 対戦終了処理を実行
            await CommonService.turnEnd(desk, player);

            if (callback instanceof Object) {
              callback(undefined, data);
            }

            return;
          }

          if ((cardPlay.special as Special) !== Special.WILD_SHUFFLE) {
            // 出したカードがシャッフルワイルドではない時、次のプレイヤーに順番を回す
            await nextPlayerAction(desk);
          }

          if (callback instanceof Object) {
            callback(undefined, data);
          }

          return;
        } catch (err) {
          CommonService.handleError(dealerId, err, callback);
        }
      }

      // 逐次処理のためキューに入れる
      queue.push(() => {
        return new Promise<void>((resolve) => {
          execute().then(() => {
            resolve();
          });
        });
      });
    },
  );

  /**
   * draw-card
   */
  socket.on(SocketConst.EMIT.DRAW_CARD, async (data: any, callback: CallbackWithData<any>) => {
    // コマンドログ記録
    CommonService.loggingCommand(socket.id, SocketConst.EMIT.DRAW_CARD, data);

    async function execute() {
      const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
      const dealerId = await redisClient.get(
        `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
      ); // ディラーコード
      getLogger('dealer', `${dealerId}`).info(
        `Event ${SocketConst.EMIT.DRAW_CARD}. data: ${JSON.stringify(data)}`,
      );

      try {
        if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);
        }
        await redisClient.set(
          `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
          socket.id,
          'EX',
          AppConst.REDIS_EXPIRE_TIME,
        ); // socketIdを延長
        const socketIds: any = (await SocketService.getAllClientOfRoom(dealerId)) || [];
        if (CommonService.canContinue(socketIds)) {
          // 接続者数がゲーム継続人数に足りない時は中断する
          const error = new BaseError({
            message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO,
          });
          CommonService.handleError(dealerId, error, callback);
          socket.disconnect(true);
          return;
        }

        const desk: Desk = JSON.parse(
          await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
        ); // ゲーム情報
        if (desk.restrictInterrupt) {
          // 割り込み処理が禁止されているので後続の処理を行わない
          const error = new BaseError({
            message: AppConst.RESUTRICT_INTERRUPT,
          });
          CommonService.handleError(dealerId, error, callback);
          return;
        }

        const isNextPlayer = CommonService.checkNextPlayer(player, desk.nextPlayer);
        if (!isNextPlayer) {
          // 現在のプレイヤーではないためペナルティ
          await handlePenalty(
            socket,
            player,
            desk,
            AppConst.CARD_PUNISH,
            new BaseError({ message: AppConst.NEXT_PLAYER_INVALID }),
            callback,
            isNextPlayer,
          );
          return;
        }

        try {
          // カードを引く処理を実行
          await handleDrawCard(desk, player, socket, callback);
        } catch (err) {
          CommonService.handleError(dealerId, err, callback);
        }
      } catch (err) {
        CommonService.handleError(dealerId, err, callback);
      }
    }

    // 逐次処理のためキューに入れる
    queue.push(() => {
      return new Promise<void>((resolve) => {
        execute().then(() => {
          resolve();
        });
      });
    });
  });

  /**
   * play-draw-card
   */
  socket.on(
    SocketConst.EMIT.PLAY_DRAW_CARD,
    async (data: OnPlayDrawCard, callback: CallbackWithData<any>) => {
      // コマンドログ記録
      CommonService.loggingCommand(socket.id, SocketConst.EMIT.PLAY_DRAW_CARD, data);

      async function execute() {
        const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
        const dealerId = await redisClient.get(
          `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
        ); // ディラーコード
        getLogger('dealer', `${dealerId}`).info(
          `Event ${SocketConst.EMIT.PLAY_DRAW_CARD}. data: ${JSON.stringify(data)}`,
        );

        try {
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }
          await redisClient.set(
            `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
            socket.id,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          ); // socketIdを延長
          const socketIds: any = (await SocketService.getAllClientOfRoom(dealerId)) || [];
          if (CommonService.canContinue(socketIds)) {
            // 接続者数がゲーム継続人数に足りない時は中断する
            const error = new BaseError({
              message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO,
            });
            CommonService.handleError(dealerId, error, callback);
            socket.disconnect(true);
            return;
          }

          let desk: Desk = JSON.parse(
            await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
          ); // ゲーム情報
          const cardPlay = desk.cardBeforeDrawCard;
          const isNextPlayer = CommonService.checkNextPlayer(player, desk.nextPlayer);
          if (!isNextPlayer && desk.restrictInterrupt) {
            // 現在のプレイヤーではなく かつ 割り込み処理が禁止されているので後続の処理を行わない
            const error = new BaseError({
              message: AppConst.RESUTRICT_INTERRUPT,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          const emitData: EmitPlayDrawCard = {
            ...data,
            player,
          };
          if (data.is_play_card) {
            emitData.card_play = cardPlay;
          }

          const isSkip =
            cardPlay &&
            ((cardPlay.special as Special) === Special.SKIP ||
              ((cardPlay.special as Special) == Special.WHITE_WILD &&
                desk.whiteWild === WhiteWild.SKIP_BIND_2));
          const preGetNextPlayer = CommonService.preGetNextPlayer({
            ...desk,
            beforePlayer: player,
            beforeCardPlay: cardPlay,
            isSkip,
            turnRight:
              cardPlay && (cardPlay.special as Special) === Special.REVERSE
                ? !desk.turnRight
                : desk.turnRight,
          }); // 情報を更新せず次のプレイヤーを取得

          // ゲームログの出力: play-draw-card
          await activityService.create({
            dealer_code: desk.id,
            event: SocketConst.EMIT.PLAY_DRAW_CARD,
            dealer: desk.dealer,
            player,
            turn: desk.turn,
            contents: {
              is_play_card: data.is_play_card,
              card_play: emitData.card_play,
              number_turn_play: desk.numberTurnPlay,
              next_player: preGetNextPlayer.nextPlayer,
              skip_player: preGetNextPlayer.skipPlayer,
              yell_uno: emitData.yell_uno,
              color_of_wild: emitData.color_of_wild,
            },
            desk: CommonService.deskLog(
              {
                ...desk,
                turnRight:
                  emitData.card_play?.special === Special.REVERSE
                    ? !desk.turnRight
                    : desk.turnRight,
                isSkip,
                yellUno: { ...desk.yellUno, [player]: data.yell_uno },
                revealDesk: [...desk.revealDesk].concat([emitData.card_play]),
              }, // desk情報更新前に書き出すので部分的に上書きしておく
              { [player]: data.is_play_card ? [emitData.card_play] : [] },
            ),
          } as any);

          if (!isNextPlayer) {
            // 現在のプレイヤーではないためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.NEXT_PLAYER_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (!desk.canCallPlayDrawCard) {
            // 引いたカードを出せないタイミングであるためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CAN_NOT_PLAY_DRAW_CARD }),
              callback,
              isNextPlayer,
            );
            return;
          }

          // バリデーションチェック
          if (data.is_play_card === undefined || data.is_play_card === null) {
            // is_play_cardフィールドが足りないまたはnullであるためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.IS_PLAY_CARD_IS_REQUIED }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (
            String(data.is_play_card) !== AppObject.BOOLEAN.TRUE &&
            String(data.is_play_card) !== AppObject.BOOLEAN.FALSE
          ) {
            // is_play_cardフィールドが規定値ではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.PARAM_IS_PLAY_CARD_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.yell_uno === undefined || data.yell_uno === null) {
            // yell_unoフィールドが足りないまたはnullであるためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.YELL_UNO_IS_REQUIED }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (
            String(data.yell_uno) !== AppObject.BOOLEAN.TRUE &&
            String(data.yell_uno) !== AppObject.BOOLEAN.FALSE
          ) {
            // yell_unoフィールドが規定値ではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.PARAM_YELL_UNO_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          let cardOfPlayer = cloneDeep(desk.cardOfPlayer[player]);
          if (!CommonService.validateCardOfPlayer(dealerId, cardPlay, cardOfPlayer)) {
            // 出したカードを所持していないためペナルティ
            // この状況は本来ありえない
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CARD_PLAY_NOT_EXIST_OF_PLAYER }),
              callback,
              isNextPlayer,
            );
            return;
          }

          const beforeCardPlay = cloneDeep(desk.beforeCardPlay);
          if (
            data.is_play_card &&
            !CommonService.isAvailableCard(cardPlay, beforeCardPlay, desk.cardAddOn)
          ) {
            // 場札に対して出せないカードを出したのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CARD_PLAY_INVALID_WITH_CARD_BEFORE }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (
            ((cardPlay.special as Special) === Special.WILD ||
              (cardPlay.special as Special) === Special.WILD_DRAW_4) &&
            !data.color_of_wild
          ) {
            // 出したカードが色変更を伴うカードだが、color_of_wildフィールドが足りないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.COLOR_WILD_IS_REQUIRED }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.color_of_wild && ARR_COLOR_OF_WILD.indexOf(data.color_of_wild as Color) === -1) {
            // color_of_wildの値が規定値ではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.COLOR_WILD_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.yell_uno && cardOfPlayer.length !== 2) {
            // UNO宣言をしたが、手札が2枚のタイミングではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CAN_NOT_SAY_UNO_AND_PLAY_CARD }),
              callback,
              isNextPlayer,
            );
            return;
          }

          // 次のプレイヤーに手番を回すため、各項目をリセット
          if (data.is_play_card) {
            desk.colorBeforeWild = desk.beforeCardPlay.color;
            desk.beforeCardPlay = cardPlay;
            cardOfPlayer = CommonService.removeCardOfPlayer(cardPlay, cardOfPlayer);
            desk.cardOfPlayer[player] = CommonService.sortCardOfPlayer(cardOfPlayer);
            desk.revealDesk.push(cardPlay);
            desk.numberCardPlay++;
          }
          desk.beforePlayer = player;
          if (
            (cardPlay.special as Special) === Special.WILD ||
            (cardPlay.special as Special) === Special.WILD_DRAW_4
          ) {
            desk.beforeCardPlay.color = data.color_of_wild;
          }
          desk.beforePlayer = player;
          if ((desk.beforeCardPlay.special as Special) === Special.WILD_DRAW_4) {
            desk.cardBeforeWildDraw4 = beforeCardPlay;
            desk.cardAddOn += 4;
          } else {
            desk.cardAddOn = 0;
          }
          desk.mustCallDrawCard = (desk.beforeCardPlay.special as Special) === Special.WILD_DRAW_4;
          desk.canCallPlayDrawCard = false;
          desk.cardBeforeDrawCard = undefined;
          desk.noPlayCount = 0;
          desk.yellUno[player] = data.yell_uno;
          desk.restrictInterrupt = false;
          desk.hasYellUnoPenalty = {};
          desk.timeout[player] = false;
          clearTimeout((<any>global)[player]);

          // ゲーム情報更新
          await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));

          if (!data.is_play_card) {
            // カードを出していないので、次のプレイヤーに順番を回しターンを終了する
            SocketService.broadcastPlayDrawCard(dealerId, emitData);
            await nextPlayerAction(desk);
            if (callback instanceof Object) {
              callback(undefined, data);
            }

            return;
          }

          // 以降、出したカードの効果を処理する
          await playCardAction(socket, desk, player, cardPlay, beforeCardPlay);
          desk = JSON.parse(await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`)); // ゲーム情報
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);

          // 引いたカードを出したことを全体に通知
          SocketService.broadcastPlayDrawCard(dealerId, emitData);
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);

          if ((cardPlay.special as Special) !== Special.WILD_SHUFFLE) {
            await nextPlayerAction(desk);
          }

          if (
            (cardPlay.special as Special) === Special.WILD ||
            (cardPlay.special as Special) === Special.WILD_DRAW_4
          ) {
            // ワイルドまたはワイルドドロー4の場合
            // ゲームログの出力: color-of-wild
            await activityService.create({
              dealer_code: desk.id,
              event: SocketConst.EMIT.COLOR_OF_WILD,
              dealer: desk.dealer,
              player,
              turn: desk.turn,
              contents: {
                color_of_wild: data.color_of_wild,
                number_turn_play: desk.numberTurnPlay,
              },
              desk: CommonService.deskLog({
                ...desk,
                beforeCardPlay: { ...desk.beforeCardPlay, color: 'black' }, // desk情報更新済であるため更新前の情報に上書き
              }),
            } as any);
            // 場札の色が変更されたことを全体に通知
            await SocketService.broadcastUpdateColor(desk.id, {
              color: beforeCardPlay.color as Color,
            });
          }

          if (callback instanceof Object) {
            callback(undefined, data);
          }

          return;
        } catch (err) {
          CommonService.handleError(dealerId, err, callback);
        }
      }

      // 逐次処理のためキューに入れる
      queue.push(() => {
        return new Promise<void>((resolve) => {
          execute().then(() => {
            resolve();
          });
        });
      });
    },
  );

  /**
   * challenge
   */
  socket.on(
    SocketConst.EMIT.CHALLENGE,
    async (data: OnChallenge, callback: CallbackWithData<any>) => {
      // コマンドログ記録
      CommonService.loggingCommand(socket.id, SocketConst.EMIT.CHALLENGE, data);

      async function execute() {
        const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
        const dealerId = await redisClient.get(
          `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
        ); // ディーラーコード
        getLogger('dealer', `${dealerId}`).info(
          `Event ${SocketConst.EMIT.CHALLENGE}. data: ${JSON.stringify(data)}`,
        );

        try {
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }

          await redisClient.set(
            `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
            socket.id,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          ); // socketIdを延長
          const socketIds: any = (await SocketService.getAllClientOfRoom(dealerId)) || [];
          if (CommonService.canContinue(socketIds)) {
            // 接続者数がゲーム継続人数に足りない時は中断する
            const error = new BaseError({
              message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO,
            });
            CommonService.handleError(dealerId, error, callback);
            socket.disconnect(true);
            return;
          }

          const desk: Desk = JSON.parse(
            await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
          ); // ゲーム情報
          const beforeCardPlay = cloneDeep(desk.beforeCardPlay);
          const beforePlayer = desk.beforePlayer;
          if (desk.restrictInterrupt) {
            // 割り込み処理が禁止されているので後続の処理を行わない
            const error = new BaseError({
              message: AppConst.RESUTRICT_INTERRUPT,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          const isNextPlayer = CommonService.checkNextPlayer(player, desk.nextPlayer);
          if (!isNextPlayer) {
            // 現在のプレイヤーではないためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.NEXT_PLAYER_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.is_challenge === undefined || data.is_challenge === null) {
            // is_challengeフィールドが足りないまたはnullであるためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.IS_CHALLENGE_IS_REQUIED }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (
            String(data.is_challenge) !== AppObject.BOOLEAN.TRUE &&
            String(data.is_challenge) !== AppObject.BOOLEAN.FALSE
          ) {
            // is_challengeフィールドが規定値ではないのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.PARAM_IS_CHALLENGE_INVALID }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (
            (beforeCardPlay.special as Special) !== Special.WILD_DRAW_4 ||
            desk.cardAddOn === 0 ||
            (desk.activationWhiteWild && desk.activationWhiteWild[player] > 0)
          ) {
            // 場札がワイルドドロー4ではない または
            // 山札から引かないといけない枚数がある または
            // 白いワイルドの効果を受けないといけない残数があるのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CAN_NOT_CHALLENGE }),
              callback,
              isNextPlayer,
            );
            return;
          }

          if (data.is_challenge) {
            // チャレンジを行った時
            const cardBeforeWildDraw4 = cloneDeep(desk.cardBeforeWildDraw4);
            const cardOfBeforePlayer = cloneDeep(desk.cardOfPlayer[beforePlayer]);
            const isChallengeSuccessfully = CommonService.isChallengeSuccessfully(
              dealerId,
              cardBeforeWildDraw4,
              cardOfBeforePlayer,
            ); // チャレンジの結果

            // ワイルドドロー4を出したプレイヤーの手札をチャレンジしたプレイヤーに公開する
            const dataEventPublicCard: EmitPublicCard = {
              card_of_player: beforePlayer,
              cards: cardOfBeforePlayer,
            };
            SocketService.sendPublicCard(socket.id, dataEventPublicCard);
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);

            // ゲームログの出力: public-card
            await activityService.create({
              dealer_code: desk.id,
              event: SocketConst.EMIT.PUBLIC_CARD,
              dealer: desk.dealer,
              player: '',
              turn: desk.turn,
              contents: {
                player: dataEventPublicCard.card_of_player,
                cards: dataEventPublicCard.cards,
                number_turn_play: desk.numberTurnPlay,
              },
              desk: CommonService.deskLog(desk),
            } as any);

            if (isChallengeSuccessfully) {
              // チャレンジが成功した場合
              getLogger('dealer', `${desk.id}`).info('challenge successfully.');
              let cardDraws: Card[] = [];
              cardDraws.push(desk.revealDesk.pop());
              const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(
                desk,
                AppConst.CARD_DRAW_CHALLENGE_SUCCESSFULLY,
              );
              if (drawCards.length < AppConst.CARD_DRAW_CHALLENGE_SUCCESSFULLY) {
                // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
                await CommonService.turnEnd(desk);
                if (callback instanceof Object) {
                  callback(undefined, undefined);
                }
                return;
              }

              // 次のイベント（play-card or draw-card）のために各項目をリセット
              desk.beforeCardPlay = desk.cardBeforeWildDraw4;
              desk.drawDesk = drawDesk;
              desk.revealDesk = revealDesk;
              cardDraws = cardDraws.concat(drawCards);
              desk.cardOfPlayer[beforePlayer] = CommonService.sortCardOfPlayer(
                cardOfBeforePlayer.concat(cardDraws),
              );
              desk.cardAddOn = 0;
              desk.mustCallDrawCard = false;
              desk.cardBeforeWildDraw4 = undefined;
              desk.noPlayCount = 0;
              desk.hasYellUnoPenalty = {};

              // ゲーム情報更新
              await redisClient.set(
                `${AppObject.REDIS_PREFIX.DESK}:${dealerId}`,
                JSON.stringify(desk),
              );

              const emitData: EmitChallenge = {
                challenger: player,
                target: beforePlayer,
                is_challenge: true,
                is_challenge_success: isChallengeSuccessfully,
              };

              // ゲームログの出力: challenge
              await activityService.create({
                dealer_code: desk.id,
                event: SocketConst.EMIT.CHALLENGE,
                dealer: desk.dealer,
                player: emitData.challenger,
                turn: desk.turn,
                contents: {
                  target: emitData.target,
                  is_challenge: emitData.is_challenge,
                  result: {
                    is_challenge_success: isChallengeSuccessfully,
                    player: emitData.target,
                    cards_receive: cardDraws,
                  },
                  number_turn_play: desk.numberTurnPlay,
                },
                desk: CommonService.deskLog(desk),
              } as any);

              // チャレンジを全体に通知
              SocketService.broadcastChallenge(dealerId, emitData);
              await BlueBird.delay(AppConst.TIMEOUT_DELAY);

              // ワイルドドロー4を出したプレイヤーにカード配布を通知
              const socketIdOfBeforePlayer = await redisClient.get(
                `${AppObject.REDIS_PREFIX.PLAYER}:${beforePlayer}`,
              );
              SocketService.sendCardToPlayer(socketIdOfBeforePlayer, {
                cards_receive: cardDraws,
                is_penalty: false,
              });
              await BlueBird.delay(AppConst.TIMEOUT_DELAY);

              // 次の処理に移す（手番は移らない）
              await nextPlayerAction(desk, data.is_challenge, isChallengeSuccessfully);

              if (callback instanceof Object) {
                callback(undefined, data);
              }

              return;
            } else {
              // チャレンジが失敗した場合
              getLogger('dealer', `${desk.id}`).info('challenge failed.');
              const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(
                desk,
                AppConst.CARD_DRAW_CHALLENGE_FAILED,
              );
              if (drawCards.length < AppConst.CARD_DRAW_CHALLENGE_FAILED) {
                // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
                await CommonService.turnEnd(desk);
                if (callback instanceof Object) {
                  callback(undefined, undefined);
                }
                return;
              }

              // 次のプレイヤーに順番を回すので各項目をリセット
              desk.drawDesk = drawDesk;
              desk.revealDesk = revealDesk;
              const cardDraws: Card[] = drawCards;
              desk.cardOfPlayer[player] = CommonService.sortCardOfPlayer(
                desk.cardOfPlayer[player].concat(cardDraws),
              );
              desk.cardAddOn = 0;
              desk.mustCallDrawCard = false;
              desk.beforePlayer = player;
              desk.cardBeforeWildDraw4 = undefined;
              desk.noPlayCount = 0;
              desk.hasYellUnoPenalty = {};
              desk.timeout[player] = false;
              clearTimeout((<any>global)[player]);

              // ゲーム情報更新
              await redisClient.set(
                `${AppObject.REDIS_PREFIX.DESK}:${dealerId}`,
                JSON.stringify(desk),
              );

              // ゲームログの出力: challenge
              const emitData: EmitChallenge = {
                challenger: player,
                target: beforePlayer,
                is_challenge: true,
                is_challenge_success: isChallengeSuccessfully,
              };
              await activityService.create({
                dealer_code: desk.id,
                event: SocketConst.EMIT.CHALLENGE,
                dealer: desk.dealer,
                player: emitData.challenger,
                turn: desk.turn,
                contents: {
                  target: emitData.target,
                  is_challenge: emitData.is_challenge,
                  result: {
                    is_challenge_success: isChallengeSuccessfully,
                    player: emitData.challenger,
                    cards_receive: cardDraws,
                  },
                  number_turn_play: desk.numberTurnPlay,
                },
                desk: CommonService.deskLog(desk),
              } as any);

              // チャレンジを全体に通知
              SocketService.broadcastChallenge(dealerId, emitData);
              await BlueBird.delay(AppConst.TIMEOUT_DELAY);

              // チャレンジを行ったプレイヤーにカード配布を通知
              SocketService.sendCardToPlayer(socket.id, {
                cards_receive: cardDraws,
                is_penalty: false,
              });
              await BlueBird.delay(AppConst.TIMEOUT_DELAY);

              // 次のプレイヤーに順番を回す
              await nextPlayerAction(desk, data.is_challenge, isChallengeSuccessfully);

              if (callback instanceof Object) {
                callback(undefined, data);
              }

              return;
            }
          } else {
            // チャレンジを行わなかった時
            getLogger('dealer', `${desk.id}`).info('no challenge');

            const emitData: EmitChallenge = {
              challenger: player,
              target: beforePlayer,
              is_challenge: false,
            };

            // ゲームログの出力: challenge
            await activityService.create({
              dealer_code: desk.id,
              event: SocketConst.EMIT.CHALLENGE,
              dealer: desk.dealer,
              player: emitData.challenger,
              turn: desk.turn,
              contents: {
                target: emitData.target,
                is_challenge: emitData.is_challenge,
                number_turn_play: desk.numberTurnPlay,
              },
              desk: CommonService.deskLog(desk),
            } as any);

            SocketService.broadcastChallenge(dealerId, emitData);
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);

            // 次のプレイヤーに順番を回す
            await nextPlayerAction(desk, data.is_challenge);

            if (callback instanceof Object) {
              callback(undefined, data);
            }

            return;
          }
        } catch (err) {
          CommonService.handleError(dealerId, err, callback);
        }
      }

      // 逐次処理のためキューに入れる
      queue.push(() => {
        return new Promise<void>((resolve) => {
          execute().then(() => {
            resolve();
          });
        });
      });
    },
  );

  socket.on(
    SocketConst.EMIT.POINTED_NOT_SAY_UNO,
    async (data: OnPointedNotSayUno, callback: CallbackWithData<any>) => {
      // コマンドログ記録
      CommonService.loggingCommand(socket.id, SocketConst.EMIT.POINTED_NOT_SAY_UNO, data);

      async function execute() {
        const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
        const dealerId = await redisClient.get(
          `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
        ); // ディラーコード
        getLogger('dealer', `${dealerId}`).info(
          `Event ${SocketConst.EMIT.POINTED_NOT_SAY_UNO}. data: ${JSON.stringify(data)}`,
        );

        try {
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }

          await redisClient.set(
            `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
            socket.id,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          ); // socketIdを延長
          const socketIds: any = (await SocketService.getAllClientOfRoom(dealerId)) || [];
          if (CommonService.canContinue(socketIds)) {
            // 接続者数がゲーム継続人数に足りない時は中断する
            const error = new BaseError({
              message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO,
            });
            CommonService.handleError(dealerId, error, callback);
            socket.disconnect(true);
            return;
          }

          const desk: Desk = JSON.parse(
            await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
          ); // ゲーム情報
          if (desk.restrictInterrupt) {
            // 割り込み処理が禁止されているので後続の処理を行わない
            const error = new BaseError({
              message: AppConst.RESUTRICT_INTERRUPT,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          if (desk.hasYellUnoPenalty[data.target]) {
            // 既に同じプレイヤーが指摘を受けているので後続の処理を行わない
            const error = new BaseError({
              message: AppConst.ALREADY_PENALIZED,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          const playerPointed = data.target;
          const emitData: EmitPointedNotSayUno = {
            pointer: player,
            target: playerPointed,
            have_say_uno: desk.yellUno[playerPointed],
          };

          // ゲームログの出力: pointed-not-say-uno
          await activityService.create({
            dealer_code: desk.id,
            event: SocketConst.EMIT.POINTED_NOT_SAY_UNO,
            dealer: desk.dealer,
            player,
            turn: desk.turn,
            contents: { ...emitData, card_of_player: desk.cardOfPlayer[playerPointed] },
            desk: CommonService.deskLog(desk),
          } as any);

          if (!playerPointed) {
            // targetフィールドがないためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.PLAYER_NAME_IS_REQUIRED }),
              callback,
              false,
            );
            return;
          }

          const players = desk.players || [];
          if (players.indexOf(playerPointed) === -1) {
            // targetで指定したコードが参加プレイヤーのコードではないためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.PLAYER_NAME_INVALID }),
              callback,
              false,
            );
            return;
          }

          const cardOfPlayerPointed = desk.cardOfPlayer[playerPointed];
          if (cardOfPlayerPointed.length !== 1) {
            // 手札の所持数が1ではない時に指摘したためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.CAN_NOT_POINTED_NOT_SAY_UNO }),
              callback,
              false,
            );
            return;
          }

          if (desk.beforePlayer !== playerPointed) {
            // 直前のプレイヤーではないプレイヤーを指定したためペナルティ
            const error = new BaseError({
              message: AppConst.OUT_OF_TARGET,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          if (desk.yellUno[playerPointed]) {
            // UNO宣言がされているので双方にペナルティはないが、指摘したことは全体に通知する
            SocketService.broadcastPointedNotSayUno(dealerId, emitData);

            if (callback instanceof Object) {
              callback(undefined, data);
            }

            return;
          }

          const cardOfBeforePlayer = cloneDeep(desk.cardOfPlayer[playerPointed]); // カードを引く
          const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(
            desk,
            AppConst.CARD_PUNISH,
          );
          if (drawCards.length < AppConst.CARD_PUNISH) {
            // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
            await CommonService.turnEnd(desk);
            if (callback instanceof Object) {
              callback(undefined, undefined);
            }
            return;
          }

          // 山札の状態を更新
          desk.drawDesk = drawDesk;
          desk.revealDesk = revealDesk;
          desk.cardOfPlayer[playerPointed] = CommonService.sortCardOfPlayer(
            cardOfBeforePlayer.concat(drawCards),
          );
          desk.hasYellUnoPenalty[playerPointed] = true;
          clearTimeout((<any>global)[desk.nextPlayer]);
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            const timeout = setTimeout(
              CommonService.timeoutPlayer,
              AppConst.TIMEOUT_OF_PLAYER,
              desk.id,
              desk.nextPlayer,
            );
            (<any>global)[desk.nextPlayer] = timeout;
          }

          // ゲーム情報更新
          await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));

          // 指摘されたプレイヤーにカード配布を通知
          const socketIdOfTargetPlayer = await redisClient.get(
            `${AppObject.REDIS_PREFIX.PLAYER}:${playerPointed}`,
          );
          SocketService.sendCardToPlayer(socketIdOfTargetPlayer, {
            cards_receive: drawCards,
            is_penalty: false,
          });
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);

          // ゲームログの出力: penalty
          const error = new BaseError({ message: AppConst.DID_NOT_SAY_UNO });
          await activityService.create({
            dealer_code: desk.id,
            event: SocketConst.EMIT.PENALTY,
            dealer: desk.dealer,
            player: '',
            turn: desk.turn,
            contents: {
              player: playerPointed,
              cards_receive: drawCards,
              number_turn_play: desk.numberTurnPlay,
              error,
            },
            desk: CommonService.deskLog(desk),
          } as any);

          // ペナルティ発動を全体に通知
          SocketService.broadcastPenalty(desk.id, {
            player: playerPointed,
            number_card_of_player: desk.cardOfPlayer[playerPointed].length,
            error: error.message,
          });
          await BlueBird.delay(AppConst.TIMEOUT_DELAY);

          SocketService.broadcastPointedNotSayUno(dealerId, emitData);

          if (callback instanceof Object) {
            callback(undefined, data);
          }

          return;
        } catch (err) {
          CommonService.handleError(dealerId, err, callback);
        }
      }

      // 逐次処理のためキューに入れる
      queue.push(() => {
        return new Promise<void>((resolve) => {
          execute().then(() => {
            resolve();
          });
        });
      });
    },
  );

  /**
   * special-logic
   */
  socket.on(
    SocketConst.EMIT.SPECIAL_LOGIC,
    async (data: OnSpecialLogic, callback: CallbackWithData<any>) => {
      // コマンドログ記録
      CommonService.loggingCommand(socket.id, SocketConst.EMIT.SPECIAL_LOGIC, data);

      const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
      const dealerId = await redisClient.get(
        `${AppObject.REDIS_PREFIX.ROOM}:${player}:${socket.id}`,
      ); // ディラーコード
      getLogger('dealer', `${dealerId}`).info(
        `Event ${SocketConst.EMIT.SPECIAL_LOGIC}. data: ${JSON.stringify(data)}`,
      );

      async function execute() {
        try {
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }

          await redisClient.set(
            `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
            socket.id,
            'EX',
            AppConst.REDIS_EXPIRE_TIME,
          ); // socketIdを延長
          const socketIds: any = (await SocketService.getAllClientOfRoom(dealerId)) || [];
          if (CommonService.canContinue(socketIds)) {
            // 接続者数がゲーム継続人数に足りない時は中断する
            const error = new BaseError({
              message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO,
            });
            CommonService.handleError(dealerId, error, callback);
            socket.disconnect(true);
            return;
          }

          const desk: Desk = JSON.parse(
            await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
          ); // ゲーム情報
          if (desk.restrictInterrupt) {
            // 割り込み処理が禁止されているので後続の処理を行わない
            const error = new BaseError({
              message: AppConst.RESUTRICT_INTERRUPT,
            });
            CommonService.handleError(dealerId, error, callback);
            return;
          }

          // ゲームログの出力: special-logic
          await activityService.create({
            dealer_code: desk.id,
            event: SocketConst.EMIT.SPECIAL_LOGIC,
            dealer: desk.dealer,
            player,
            turn: desk.turn,
            contents: {
              title: data.title,
              number_turn_play: desk.numberTurnPlay,
            },
            desk: CommonService.deskLog(desk),
          } as any);

          if (!data.title) {
            // titleフィールドがないためペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.PARAM_TITLE_INVALID }),
              callback,
              false,
            );
            return;
          }

          if (data.title && data.title.length > AppConst.MAX_SPLECIAL_LOGIC_NAME_LENGTH) {
            // titleが最大長を超えているのでペナルティ
            await handlePenalty(
              socket,
              player,
              desk,
              AppConst.CARD_PUNISH,
              new BaseError({ message: AppConst.SPLECIAL_LOGIC_TITLE_TOO_LONG }),
              callback,
              false,
            );
            return;
          }

          if (desk.specialLogic[player] >= AppConst.MAX_SPECIAL_LOGIC) {
            // スペシャルロジックの実行制限回数に到達しているので、後続の処理を行わない
            if (callback instanceof Object) {
              callback(undefined, data);
            }
            return;
          }

          if (!desk.specialLogic || !desk.specialLogic[player]) {
            // フィールドがなければ新規作成
            desk.specialLogic[player] = 0;
          }
          desk.specialLogic[player]++; // 実行数を加算
          clearTimeout((<any>global)[desk.nextPlayer]);
          if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
            const timeout = setTimeout(
              CommonService.timeoutPlayer,
              AppConst.TIMEOUT_OF_PLAYER,
              desk.dealer,
              desk.nextPlayer,
            );
            (<any>global)[desk.nextPlayer] = timeout;
          }

          // ゲーム情報更新
          await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));

          if (callback instanceof Object) {
            callback(undefined, data);
          }

          return;
        } catch (err) {
          CommonService.handleError(dealerId, err, callback);
        }
      }

      // 逐次処理のためキューに入れる
      queue.push(() => {
        return new Promise<void>((resolve) => {
          execute().then(() => {
            resolve();
          });
        });
      });
    },
  );

  socket.on('disconnect', async function () {
    const playerCode = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`); // プレイヤーコード
    const dealerCode = await redisClient.get(
      `${AppObject.REDIS_PREFIX.ROOM}:${playerCode}:${socket.id}`,
    ); // ディラーコード
    getLogger('dealer', `${dealerCode || 'no-dealer-id'}`).info(
      `socket disconnect. socketId: ${JSON.stringify(socket.id)}. playerCode: ${playerCode}`,
    );

    if (dealerCode && playerCode) {
      // ディラーコードとプレイヤーコードがあれば、ディーラーのログに切断を記録する
      const dealer = await dealerService.detailByCondition({ code: dealerCode });
      if (dealer) {
        if ((dealer.status as StatusGame) === StatusGame.NEW) {
          // ゲーム開始前の場合は、プレイヤーリストから削除する
          const players = dealer.players || [];
          const newPlayers = remove(players, (player) => {
            return player !== playerCode;
          });
          await dealerService.updateByCondition({
            conditions: { code: dealer.code },
            data: {
              $set: { players: newPlayers },
            },
          });
        }

        // ゲームログの出力: disconnect
        await activityService.create({
          dealer_code: dealerCode,
          event: 'disconnect',
          dealer: dealer.name,
          player: playerCode,
          contents: socket.id,
        });
      }
    }

    // 各種Redisのキーを削除する
    const keyDealerPattern = `${AppObject.REDIS_PREFIX.ROOM}:${playerCode}:*`;
    let keys = await redisClient.keys(keyDealerPattern);
    const keyPlayerPattern = `${AppObject.REDIS_PREFIX.PLAYER}:${playerCode}:*`;
    keys = keys.concat(await redisClient.keys(keyPlayerPattern));
    redisClient.del(`${AppObject.REDIS_PREFIX.PLAYER}:${playerCode}`);
    redisClient.del(`${AppObject.REDIS_PREFIX.PLAYER}:${socket.id}`);
    keys.forEach((key) => {
      redisClient.del(key);
    });
  });
});

export default 'socketServer';
