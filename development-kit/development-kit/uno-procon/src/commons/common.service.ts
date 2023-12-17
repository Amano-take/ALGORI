import { cloneDeep, isEqual, shuffle } from 'lodash';
import * as BlueBird from 'bluebird';

import { ActivityService } from '../api/activity/activity.service';
import { DealerService } from '../api/dealer/dealer.service';
import { DealerModel } from '../api/dealer/dealer.model';
import { PlayerService } from '../api/player/player.service';
import { AppConst } from './consts/app.const';
import { AppObject } from './consts/app.object';
import { SocketConst } from './consts/socket.const';
import {
  ARR_COLOR,
  ARR_NUMBER,
  ARR_SPECIAL,
  ARR_WILD_SPECIAL,
  Card,
  Color,
  Desk,
  DrawReason,
  Special,
  StatusGame,
  WhiteWild,
} from './consts/app.enum';
import APP_CONFIG from '../configs/app.config';
import redisClient from '../configs/database/redis.config';
import { Environment, getLogger } from '../libs/commons';
import { BaseError } from '../libs/standard';

const activityService = new ActivityService();
const dealerService = new DealerService();
const playerService = new PlayerService();

type CallbackWithData<T> = (err: any, data: T) => void;

const SORT_ORDER = [Color.YELLOW, Color.GREEN, Color.BLUE, Color.RED, Color.BLACK, Color.WHITE];

export class CommonService {
  /**
   * Common Service初期化処理
   */
  public static async init() {
    getLogger('admin', '').info('Init commonService.');
    await dealerService.update({
      conditions: {},
      data: { status: StatusGame.FINISH },
    });
  }

  /**
   * 色の選出
   * numを14で割った余り
   * [13]   黒 num: 13, 27, 41, 55, 69, 83, 97, 111
   *
   * numを14で割り小数点以下を切り捨てた値
   * [0][4] 赤 num:  0〜12, 56〜68
   * [1][5] 黃 num: 14〜26, 70〜82
   * [2][6] 緑 num: 28〜40, 84〜96
   * [3][7] 青 num: 42〜54, 98〜110
   * @param num index値 0 - 111
   * @returns {Color} 色
   */
  public static cardColor(num: number): Color {
    let color: Color;
    if (num % 14 === 13) {
      return Color.BLACK;
    }

    switch (Math.floor(num / 14)) {
      case 0:
      case 4:
        color = Color.RED;
        break;
      case 1:
      case 5:
        color = Color.YELLOW;
        break;
      case 2:
      case 6:
        color = Color.GREEN;
        break;
      case 3:
      case 7:
        color = Color.BLUE;
        break;
    }

    return color;
  }

  /**
   * 数字or記号の選出
   * numを14で割った余り
   * [10]    Skip
   * [11]    Reverse
   * [12]    Draw2
   * [13]    Wild or WildDraw4
   * [その他] 数字
   * @param num index値
   * @returns {number | Special} 数字 or 記号
   */
  public static cardType(num: number): number | Special {
    switch (num % 14) {
      case 10: // Skip
        return Special.SKIP;
      case 11: // Reverse
        return Special.REVERSE;
      case 12: // Draw 2
        return Special.DRAW_2;
      case 13: // Wild or Wild Draw 4
        if (Math.floor(num / 14) >= 4) {
          return Special.WILD;
        } else {
          return Special.WILD_DRAW_4;
        }
      default:
        return num % 14;
    }
  }

  /**
   * ゲームで使用するカード一覧を生成する
   *
   * 0           1枚 × 4色 = 4枚
   * 1           2枚 × 4色 = 8枚
   * 2           2枚 × 4色 = 8枚
   * 3           2枚 × 4色 = 8枚
   * 4           2枚 × 4色 = 8枚
   * 5           2枚 × 4色 = 8枚
   * 6           2枚 × 4色 = 8枚
   * 7           2枚 × 4色 = 8枚
   * 8           2枚 × 4色 = 8枚
   * 9           2枚 × 4色 = 8枚
   * Draw2       2枚 × 4色 = 8枚
   * Reverse     2枚 × 4色 = 8枚
   * Skip        2枚 × 4色 = 8枚
   * Wild        4枚 × 1色 = 4枚
   * WildDraw4   4枚 × 1色 = 4枚
   * ShuffleWild 1枚 × 1色 = 1枚
   * WhiteWild   3枚 × 1色 = 3枚
   * 合計: 112枚
   *
   *
   *   [0]: { color: 'red', number: 0 }
   *   [1]: { color: 'red', number: 1 }
   *   [2]: { color: 'red', number: 2 }
   *   [3]: { color: 'red', number: 3 }
   *   [4]: { color: 'red', number: 4 }
   *   [5]: { color: 'red', number: 5 }
   *   [6]: { color: 'red', number: 6 }
   *   [7]: { color: 'red', number: 7 }
   *   [8]: { color: 'red', number: 8 }
   *   [9]: { color: 'red', number: 9 }
   *  [10]: { color: 'red', special: 'skip' }
   *  [11]: { color: 'red', special: 'reverse' }
   *  [12]: { color: 'red', special: 'draw_2' }
   *  [13]: { color: 'black', special: 'wild_draw_4' }
   *  [14]: { color: 'yellow', number: 0 }
   *  [15]: { color: 'yellow', number: 1 }
   *  [16]: { color: 'yellow', number: 2 }
   *  [17]: { color: 'yellow', number: 3 }
   *  [18]: { color: 'yellow', number: 4 }
   *  [19]: { color: 'yellow', number: 5 }
   *  [20]: { color: 'yellow', number: 6 }
   *  [21]: { color: 'yellow', number: 7 }
   *  [22]: { color: 'yellow', number: 8 }
   *  [23]: { color: 'yellow', number: 9 }
   *  [24]: { color: 'yellow', special: 'skip' }
   *  [25]: { color: 'yellow', special: 'reverse' }
   *  [26]: { color: 'yellow', special: 'draw_2' }
   *  [27]: { color: 'black', special: 'wild_draw_4' }
   *  [28]: { color: 'green', number: 0 }
   *  [29]: { color: 'green', number: 1 }
   *  [30]: { color: 'green', number: 2 }
   *  [31]: { color: 'green', number: 3 }
   *  [32]: { color: 'green', number: 4 }
   *  [33]: { color: 'green', number: 5 }
   *  [34]: { color: 'green', number: 6 }
   *  [35]: { color: 'green', number: 7 }
   *  [36]: { color: 'green', number: 8 }
   *  [37]: { color: 'green', number: 9 }
   *  [38]: { color: 'green', special: 'skip' }
   *  [39]: { color: 'green', special: 'reverse' }
   *  [40]: { color: 'green', special: 'draw_2' }
   *  [41]: { color: 'black', special: 'wild_draw_4' }
   *  [42]: { color: 'blue', number: 0 }
   *  [43]: { color: 'blue', number: 1 }
   *  [44]: { color: 'blue', number: 2 }
   *  [45]: { color: 'blue', number: 3 }
   *  [46]: { color: 'blue', number: 4 }
   *  [47]: { color: 'blue', number: 5 }
   *  [48]: { color: 'blue', number: 6 }
   *  [49]: { color: 'blue', number: 7 }
   *  [50]: { color: 'blue', number: 8 }
   *  [51]: { color: 'blue', number: 9 }
   *  [52]: { color: 'blue', special: 'skip' }
   *  [53]: { color: 'blue', special: 'reverse' }
   *  [54]: { color: 'blue', special: 'draw_2' }
   *  [55]: { color: 'black', special: 'wild_draw_4' }
   *  [56]: { color: 'red', number: 1 }
   *  [57]: { color: 'red', number: 2 }
   *  [58]: { color: 'red', number: 3 }
   *  [59]: { color: 'red', number: 4 }
   *  [60]: { color: 'red', number: 5 }
   *  [61]: { color: 'red', number: 6 }
   *  [62]: { color: 'red', number: 7 }
   *  [63]: { color: 'red', number: 8 }
   *  [64]: { color: 'red', number: 9 }
   *  [65]: { color: 'red', special: 'skip' }
   *  [66]: { color: 'red', special: 'reverse' }
   *  [67]: { color: 'red', special: 'draw_2' }
   *  [68]: { color: 'black', special: 'wild' }
   *  [69]: { color: 'yellow', number: 1 }
   *  [70]: { color: 'yellow', number: 2 }
   *  [71]: { color: 'yellow', number: 3 }
   *  [72]: { color: 'yellow', number: 4 }
   *  [73]: { color: 'yellow', number: 5 }
   *  [74]: { color: 'yellow', number: 6 }
   *  [75]: { color: 'yellow', number: 7 }
   *  [76]: { color: 'yellow', number: 8 }
   *  [77]: { color: 'yellow', number: 9 }
   *  [78]: { color: 'yellow', special: 'skip' }
   *  [79]: { color: 'yellow', special: 'reverse' }
   *  [80]: { color: 'yellow', special: 'draw_2' }
   *  [81]: { color: 'black', special: 'wild' }
   *  [82]: { color: 'green', number: 1 }
   *  [83]: { color: 'green', number: 2 }
   *  [84]: { color: 'green', number: 3 }
   *  [85]: { color: 'green', number: 4 }
   *  [86]: { color: 'green', number: 5 }
   *  [87]: { color: 'green', number: 6 }
   *  [88]: { color: 'green', number: 7 }
   *  [89]: { color: 'green', number: 8 }
   *  [90]: { color: 'green', number: 9 }
   *  [91]: { color: 'green', special: 'skip' }
   *  [92]: { color: 'green', special: 'reverse' }
   *  [93]: { color: 'green', special: 'draw_2' }
   *  [94]: { color: 'black', special: 'wild' }
   *  [95]: { color: 'blue', number: 1 }
   *  [96]: { color: 'blue', number: 2 }
   *  [97]: { color: 'blue', number: 3 }
   *  [98]: { color: 'blue', number: 4 }
   *  [99]: { color: 'blue', number: 5 }
   * [100]: { color: 'blue', number: 6 }
   * [101]: { color: 'blue', number: 7 }
   * [102]: { color: 'blue', number: 8 }
   * [103]: { color: 'blue', number: 9 }
   * [104]: { color: 'blue', special: 'skip' }
   * [105]: { color: 'blue', special: 'reverse' }
   * [106]: { color: 'blue', special: 'draw_2' }
   * [107]: { color: 'black', special: 'wild' }
   * [108]: { color: 'black', special: 'wild_shuffle' }
   * [109]: { color: 'white', special: 'white_wild' }
   * [110]: { color: 'white', special: 'white_wild' }
   * [111]: { color: 'white', special: 'white_wild' }
   *
   * @param {boolean} useWhiteWild 白いワイルドが適用されるゲームか
   * @returns {Card[]} カード一覧
   */
  public static desk(useWhiteWild?: boolean): Card[] {
    const cards: Card[] = [];
    for (let i = 0; i < 112; i++) {
      const color = CommonService.cardColor(i);
      const type = CommonService.cardType(i);
      if (type === 0 && i >= 56) {
        // 0のカードは各色1枚であるため、iが56以上の0は無視する = 全体に4枚分の空きができる
        continue;
      }
      const isSpecial: boolean = typeof type === 'string' ? true : false;
      cards.push({
        color: color,
        number: isSpecial ? undefined : Number(type),
        special: isSpecial ? String(type) : undefined,
      });
    }

    // シャッフルワイルドを追加 4枚の空きのうち1枚充当
    cards.push({
      color: Color.BLACK,
      special: Special.WILD_SHUFFLE,
    });

    // 白いワイルドを追加 4枚の空きのうち残りの3枚に充当
    if (useWhiteWild) {
      for (let i = 0; i < 3; i++) {
        cards.push({
          color: Color.WHITE,
          special: Special.WHITE_WILD,
        });
      }
    }

    return cards;
  }

  /**
   * ランダムな整数を取得する
   * @param {number} num 最大値
   * @returns {number}
   */
  public static randomByNumber(num: number) {
    return Math.floor(Math.random() * num);
  }

  /**
   * 山札をシャッフルする
   * 必ずしも全てのカードが揃っているとは限らず、手札や場札によって最大枚数は変化する
   * @param {Card[]} cards 山札
   * @param {number} time シャッフルする回数
   * @returns {Card[]} シャッフル後の山札
   */
  public static shuffleDesk(cards: Card[], time: number = AppConst.TIME_SHUFFLE): Card[] {
    const len = cards.length; // card length
    for (let i = 0; i < time; i++) {
      const j = CommonService.randomByNumber(len);
      const k = CommonService.randomByNumber(len);
      const tmp = cloneDeep(cards[k]);
      cards[k] = cloneDeep(cards[j]);
      cards[j] = cloneDeep(tmp);
    }

    return cards;
  }

  /**
   * ゲーム情報の初期化
   * @param {boolean} useWhiteWild 白いワイルドが適用されるゲームか
   * @returns {Card[]} ゲーム情報
   */
  public static initDesk(useWhiteWild?: boolean): Card[] {
    let desk = CommonService.desk(useWhiteWild);
    desk = CommonService.shuffleDesk(desk, AppConst.TIME_SHUFFLE);
    return desk;
  }

  /**
   * 対戦開始時の手札を配布する
   * @param {Card[]} cards
   * @param {string[]} players
   * @returns {cards: Card[], mapPlayer: Map<string, Card[]>} 配布後の山札と各プレイヤーに配布した手札のマップ
   */
  public static deal(
    cards: Card[],
    players: string[],
  ): { cards: Card[]; mapPlayer: Map<string, Card[]> } {
    const len = players.length;
    const mapPlayer = new Map<string, Card[]>();
    for (let i = 0; i < len * AppConst.CARD_DEAL; i++) {
      const card = cards.pop();
      const player = players[i % len];
      const cardsPlayer = mapPlayer.get(player) || [];
      cardsPlayer.push(card);
      mapPlayer.set(player, cardsPlayer);
    }

    return {
      cards,
      mapPlayer,
    };
  }

  /**
   * 最初のカードを取得する
   * @param {Card[]} cards 山札
   * @returns {newCards: Card[], firstCard: Card} 最初のカードを抽出後の山札と最初のカード
   */
  public static getFirstCard(cards: Card[]): { newCards: Card[]; firstCard: Card } {
    let isContinue = true;
    let firstCard = cards.pop(); // 山札の先頭カード

    while (isContinue) {
      if (
        (firstCard.special as Special) !== Special.WILD_DRAW_4 &&
        (firstCard.special as Special) !== Special.WILD_SHUFFLE &&
        (firstCard.special as Special) !== Special.WHITE_WILD
      ) {
        // ワイルドドロー4・シャッフルワイルド・白いワイルドのいずれでもない場合、最初のカードを確定
        isContinue = false;
        break;
      }
      cards.push(firstCard); // 先頭のカードを山札に戻す
      cards = CommonService.shuffleDesk(cards); // カードを再シャッフル
      firstCard = cards.pop(); // 再度先頭のカードを保存
    }

    return {
      newCards: cards,
      firstCard,
    };
  }

  /**
   * 最初のプレイヤーの行動
   * @param {Desk} desk ゲーム情報
   * @param {Card} firstCard 最初のカード
   * @param {string} firstPlayer 最初のプレイヤーコード
   * @param {Map<string, string>} mapPlayerToSocket 全プレイヤーのSocketIDマップ
   */
  public static async firstPlayerAction(
    desk: Desk,
    firstCard: Card,
    firstPlayer: string,
    mapPlayerToSocket: Map<string, string>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SocketService } = require('./socket-io.service');
    switch (firstCard.special as Special) {
      case Special.WILD_SHUFFLE:
      case Special.WILD_DRAW_4:
      case Special.WHITE_WILD: {
        // NOTE 最初のカード選出時点で除外されるのこの処理に入ることは無いが念のため記述
        break;
      }
      case Special.WILD: {
        // 最初のカードがワイルドだった時、最初のプレイヤーが色を選択し次のプレイヤーに順番を回す

        // 最初のプレイヤーに色の選択を要求する
        const socketIdOfFirstPlayer = mapPlayerToSocket.get(firstPlayer);
        // タイムアウトを仕掛ける
        desk.nextPlayer = firstPlayer;
        desk.timeout[firstPlayer] = true;

        // ゲーム情報更新
        await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

        if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
          const timeout = setTimeout(
            CommonService.timeoutColorOfWild,
            AppConst.TIMEOUT_OF_PLAYER,
            desk.id,
            firstPlayer,
          );
          (<any>global)[firstPlayer] = timeout;
        }

        // ゲームログの出力: color-change-request
        await activityService.create({
          dealer_code: desk.id,
          event: 'color-change-request',
          dealer: desk.dealer,
          player: '',
          turn: desk.turn,
          contents: {
            player: desk.nextPlayer,
            number_turn_play: desk.numberTurnPlay,
          },
          desk: CommonService.deskLog(desk),
        } as any);

        // 最初のプレイヤーに色の変更を要求する
        await SocketService.sendChoseColorOfWild(socketIdOfFirstPlayer);
        break;
      }
      default: {
        // 最初のカードがその他のカードだった時
        const players = desk.players;
        const len = players.length;
        const beforeCard = desk.beforeCardPlay;
        const indexOfFirstPlayer = players.indexOf(firstPlayer);
        getLogger('dealer', `${desk.id}`).debug(`indexOfFirstPlayer ${indexOfFirstPlayer}`);

        // 最初のプレイヤーを選出する
        const turnRight = desk.turnRight;
        let indexNext = turnRight ? 0 : -1;
        if (desk.isSkip) {
          // 最初のカードがスキップの場合、最初のプレイヤーはスキップされる
          indexNext = turnRight ? 1 : -1;
          desk.isSkip = false;
        }
        let indexOfNextPlayer = (indexOfFirstPlayer + indexNext) % len;
        if (!turnRight) {
          indexOfNextPlayer = (indexOfFirstPlayer + len + indexNext) % len;
        }
        getLogger('dealer', `${desk.id}`).debug(`indexOfNextPlayer ${indexOfNextPlayer}`);
        const nextPlayer = players[indexOfNextPlayer];
        desk.nextPlayer = nextPlayer;
        desk.timeout[nextPlayer] = true;

        // ゲーム情報更新
        await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

        if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
          const timeout = setTimeout(
            CommonService.timeoutPlayer,
            AppConst.TIMEOUT_OF_PLAYER,
            desk.id,
            nextPlayer,
          );
          (<any>global)[nextPlayer] = timeout;
        }

        // ゲームログの出力: next-player
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
            must_call_draw_card: String(desk.mustCallDrawCard) === 'true',
            draw_reason: CommonService.getDrawReason(desk, nextPlayer),
            number_card_play: desk.numberCardPlay,
            number_turn_play: desk.numberTurnPlay,
            number_card_of_player: CommonService.getCardCountOfPlayers(desk),
          },
          desk: CommonService.deskLog(desk),
        } as any);

        // 次に行動を起こすプレイヤーに自分の順番を通知
        const socketIdOfNextPlayer = mapPlayerToSocket.get(nextPlayer);
        SocketService.sendNextPlayer(socketIdOfNextPlayer, {
          next_player: nextPlayer,
          before_player: desk.beforePlayer,
          card_before: beforeCard,
          card_of_player: desk.cardOfPlayer[nextPlayer],
          must_call_draw_card: desk.mustCallDrawCard,
          draw_reason: CommonService.getDrawReason(desk, nextPlayer),
          turn_right: desk.turnRight,
          number_card_play: desk.numberCardPlay,
          number_turn_play: desk.numberTurnPlay,
          number_card_of_player: CommonService.getCardCountOfPlayers(desk),
        });

        break;
      }
    }
  }

  /**
   * 対面のプレイヤーを取得する（DB更新なし）
   * @param {Desk} desk ゲーム情報
   * @returns {string}
   */
  public static preGetOppositePlayer(desk: Desk): string {
    const indexOfBeforePlayer = desk.players.indexOf(desk.beforePlayer);
    const indexOpposite = desk.turnRight ? 2 : -2; // 対面のプレイヤー（2つ先プレイヤー）
    const indexOfOppositePlayer = desk.turnRight
      ? (indexOfBeforePlayer + indexOpposite) % AppConst.MAX_PLAYER
      : (indexOfBeforePlayer + AppConst.MAX_PLAYER + indexOpposite) % AppConst.MAX_PLAYER;
    const oppositePlayer = desk.players[indexOfOppositePlayer];
    getLogger('dealer', `${desk.id}`).debug(`indexOfOppsitePlayer ${indexOfOppositePlayer}`);
    return oppositePlayer;
  }

  /**
   * 次のプレイヤーを取得する（DB更新なし）
   * @param {Desk} desk ゲーム情報
   * @returns {nextPlayer: string, skipPlayer: string}
   */
  public static preGetNextPlayer(desk: Desk): {
    nextPlayer: string;
    skipPlayer: string;
  } {
    const indexOfBeforePlayer = desk.players.indexOf(desk.beforePlayer);
    getLogger('dealer', `${desk.id}`).debug(`players ${JSON.stringify(desk.players)}`);
    getLogger('dealer', `${desk.id}`).debug(`turnRight ${desk.turnRight}`);
    getLogger('dealer', `${desk.id}`).debug(`isSkip ${desk.isSkip}`);
    getLogger('dealer', `${desk.id}`).debug(`indexOfBeforePlayer ${indexOfBeforePlayer}`);

    const indexNext = desk.turnRight ? 1 : -1; // 次のプレイヤー（1つ先プレイヤー）
    const indexOfNextPlayer = desk.turnRight
      ? (indexOfBeforePlayer + indexNext) % AppConst.MAX_PLAYER
      : (indexOfBeforePlayer + AppConst.MAX_PLAYER + indexNext) % AppConst.MAX_PLAYER;
    const nextPlayer = desk.players[indexOfNextPlayer];
    getLogger('dealer', `${desk.id}`).debug(`indexOfNextPlayer ${indexOfNextPlayer}`);

    const oppositePlayer = CommonService.preGetOppositePlayer(desk);
    getLogger('dealer', `${desk.id}`).debug(
      `nextPlayer ${desk.isSkip ? oppositePlayer : nextPlayer}, skipPlayer ${
        desk.isSkip ? nextPlayer : undefined
      }`,
    );

    return {
      nextPlayer: desk.isSkip ? oppositePlayer : nextPlayer,
      skipPlayer: desk.isSkip ? nextPlayer : undefined,
    };
  }

  /**
   * 次のプレイヤーを取得する（DB更新あり）
   * @param {string} dealerId ディーラーコード
   * @returns {Promise<{nextPlayer: string, beforeCard: Card, mustCallDrawCard: boolean, numberTurnPlay: number}>}
   */
  public static async getNextPlayer(dealerId: string): Promise<{
    nextPlayer: string;
    beforeCard: Card;
    mustCallDrawCard: boolean;
    numberTurnPlay: number;
  }> {
    const deskString = await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`); // ゲーム情報（文字列）
    const desk: Desk = JSON.parse(deskString); // ゲーム情報
    const { nextPlayer } = CommonService.preGetNextPlayer(desk);
    desk.nextPlayer = nextPlayer;
    desk.isSkip = false; // スキップフラグを解除
    desk.timeout[nextPlayer] = true;
    desk.numberTurnPlay++;
    clearTimeout((<any>global)[nextPlayer]);

    if (desk.activationWhiteWild && desk.activationWhiteWild[nextPlayer] > 0) {
      // 白いワイルドの効果を受ける残回数が残っている場合、カードを引かせるフラグを立てる
      desk.mustCallDrawCard = true;
    }

    // ゲーム情報更新
    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));
    await BlueBird.delay(AppConst.TIMEOUT_DELAY);

    if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
      const timeout = setTimeout(
        CommonService.timeoutPlayer,
        AppConst.TIMEOUT_OF_PLAYER,
        desk.id,
        nextPlayer,
      );
      (<any>global)[nextPlayer] = timeout;
    }

    return {
      nextPlayer,
      beforeCard: desk.beforeCardPlay,
      mustCallDrawCard: desk.mustCallDrawCard,
      numberTurnPlay: desk.numberTurnPlay,
    };
  }

  /**
   * タイムアウト処理
   * @param {string} dealerId ディーラー情報
   * @param {string} timeoutPlayer プレイヤーID
   * @returns
   */
  public static async timeoutPlayer(dealerId: string, timeoutPlayer: string) {
    const deskString = await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`); // ゲーム情報（文字列）
    const desk: Desk = JSON.parse(deskString); // ゲーム情報
    if (!desk) return;

    try {
      getLogger('dealer', `${desk.id}`).info(`desk.timeout[${timeoutPlayer}]`);
      if (desk.timeout[timeoutPlayer]) {
        // ペナルティとして引くカードは手札の所持数を考慮する
        const { cardOfPlayer } = desk;
        const have = cardOfPlayer[timeoutPlayer].length; // 手札の枚数
        const margin = AppConst.MAX_CARD_OF_PLAYER - have; // 所持できる最大枚数と手札数との差
        const count = margin > AppConst.CARD_PUNISH ? AppConst.CARD_PUNISH : margin; // ペナルティでカードを引くと最大枚数を超える場合は、引く枚数を調整する
        const penaltyDraw = CommonService.drawCard(desk, count);

        desk.beforePlayer = timeoutPlayer;
        desk.drawDesk = penaltyDraw.drawDesk;
        desk.revealDesk = penaltyDraw.revealDesk;
        if (penaltyDraw.drawCards.length) {
          // カードを引くことができれば盤面に動きがあったとみなす
          desk.noPlayCount = 0;
        } else {
          // カードを引くことができなかったので盤面に動きが無かったとみなす
          desk.noPlayCount++;
        }
        desk.cardOfPlayer[timeoutPlayer] = CommonService.sortCardOfPlayer(
          desk.cardOfPlayer[timeoutPlayer].concat(penaltyDraw.drawCards),
        );

        desk.yellUno[timeoutPlayer] = false;
        desk.restrictInterrupt = false;
        desk.timeout[timeoutPlayer] = false;
        clearTimeout((<any>global)[timeoutPlayer]);

        // ゲーム情報更新
        await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

        // ペナルティで引いたカードをプレイヤーに通知
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { SocketService } = require('./socket-io.service');
        const socketIdOfTimeoutPlayer = await redisClient.get(
          `${AppObject.REDIS_PREFIX.PLAYER}:${timeoutPlayer}`,
        );
        SocketService.sendCardToPlayer(socketIdOfTimeoutPlayer, {
          cards_receive: penaltyDraw.drawCards,
          is_penalty: true,
        });
        await BlueBird.delay(AppConst.TIMEOUT_DELAY);

        // ゲームログの出力: penalty
        await activityService.create({
          dealer_code: desk.id,
          event: 'penalty',
          dealer: desk.dealer,
          player: '',
          turn: desk.turn,
          contents: {
            player: timeoutPlayer,
            cards_receive: penaltyDraw.drawCards,
            number_turn_play: desk.numberTurnPlay,
            error: 'timeout',
          },
          desk: CommonService.deskLog(desk),
        } as any);

        // ペナルティを受けたことを全体に通知する
        SocketService.broadcastPenalty(desk.id, {
          player: timeoutPlayer,
          number_card_of_player: desk.cardOfPlayer[timeoutPlayer].length,
          error: 'timeout',
        });
        await BlueBird.delay(AppConst.TIMEOUT_DELAY);

        if (penaltyDraw.drawCards.length < count) {
          // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
          await CommonService.turnEnd(desk);
          return;
        }

        // 前のプレイヤーが出したカードの効果により引くカードは所持数の考慮は不要
        const activationWhiteWild =
          desk.activationWhiteWild && desk.activationWhiteWild[timeoutPlayer] ? 1 : 0; // 白いワイルドの効果によって引くカードの枚数
        const cardAddOn = desk.cardAddOn || activationWhiteWild; // 他のプレイヤーが出したカードの効果でカードを引く

        if (cardAddOn) {
          const numberOfCardsBeforeDrawCard = desk.drawDesk.length; // カードを引く前の山札の枚数
          const drawReason = CommonService.getDrawReason(desk, timeoutPlayer); // カードを引く理由
          // カードを引く
          const addDraw = CommonService.drawCard(desk, cardAddOn);
          desk.drawDesk = addDraw.drawDesk;
          desk.revealDesk = addDraw.revealDesk;
          desk.cardOfPlayer[timeoutPlayer] = CommonService.sortCardOfPlayer(
            desk.cardOfPlayer[timeoutPlayer].concat(addDraw.drawCards),
          );
          if (addDraw.drawCards.length) {
            // カードを引いているので盤面硬直はリセット
            desk.noPlayCount = 0;

            if (activationWhiteWild) {
              // 白いワイルドの効果回数がある場合は減少させる
              desk.activationWhiteWild[timeoutPlayer]--;
            }
          } else {
            desk.noPlayCount++;
          }
          desk.cardAddOn = 0;
          desk.mustCallDrawCard = false;
          desk.canCallPlayDrawCard = false;
          desk.cardBeforeDrawCard = undefined;
          desk.numberCardPlay++;
          desk.hasYellUnoPenalty = {};

          // ゲーム情報更新
          await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));

          if (addDraw.drawCards.length) {
            // ゲームログの出力: draw-card
            const dataCb = { player: timeoutPlayer, is_draw: false, can_play_draw_card: false };
            await activityService.create({
              dealer_code: desk.id,
              event: SocketConst.EMIT.DRAW_CARD,
              dealer: desk.dealer,
              player: timeoutPlayer,
              turn: desk.turn,
              contents: {
                can_play_draw_card: dataCb.can_play_draw_card,
                card_draw: addDraw.drawCards,
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

            SocketService.broadcastDrawCard(desk.id, dataCb);
            await BlueBird.delay(AppConst.TIMEOUT_DELAY);
          }

          if (addDraw.drawCards.length < cardAddOn) {
            // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
            await CommonService.turnEnd(desk);
            return;
          }

          if (desk.noPlayCount >= AppConst.NO_PLAY_MAX_LAP * desk.players.length) {
            // 盤面に動きがなく限界数を超えた場合は対戦終了
            await CommonService.turnEnd(desk);
            return;
          }
        }

        // 次のプレイヤーに手番を通知する
        const { nextPlayer, beforeCard, mustCallDrawCard, numberTurnPlay } =
          await CommonService.getNextPlayer(desk.id);
        const socketIdOfNextPlayer = await redisClient.get(
          `${AppObject.REDIS_PREFIX.PLAYER}:${nextPlayer}`,
        );

        if (socketIdOfNextPlayer) {
          // ゲームログの出力: next-player
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
              must_call_draw_card: String(desk.mustCallDrawCard) === 'true',
              draw_reason: CommonService.getDrawReason(desk, nextPlayer),
              number_card_play: desk.numberCardPlay,
              number_turn_play: numberTurnPlay,
              number_card_of_player: CommonService.getCardCountOfPlayers(desk),
            },
            desk: CommonService.deskLog(desk),
          } as any);

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
        }
        return;
      }
    } catch (error) {
      getLogger('dealer', `${desk.id}`).error(`timeoutPlayer error`);
    }
  }

  /**
   * 色変更のタイムアウト処理
   * @param {string} dealerId ディーラー情報
   * @param {string} timeoutPlayer プレイヤーID
   * @returns
   */
  public static async timeoutColorOfWild(dealerId: string, timeoutPlayer: string) {
    const deskString = await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`); // ゲーム情報（文字列）
    const desk: Desk = JSON.parse(deskString); // ゲーム情報
    if (!desk) return;

    try {
      getLogger('dealer', `${desk.id}`).info(`timeoutColorOfWild desk.timeout[${timeoutPlayer}]`);
      if (desk.timeout[timeoutPlayer]) {
        // ペナルティとして引くカードは手札の所持数を考慮する
        const { cardOfPlayer } = desk;
        const have = cardOfPlayer[timeoutPlayer].length; // 手札の枚数
        const margin = AppConst.MAX_CARD_OF_PLAYER - have; // 所持できる最大枚数と手札数との差
        const count = margin > AppConst.CARD_PUNISH ? AppConst.CARD_PUNISH : margin; // ペナルティでカードを引くと最大枚数を超える場合は、引く枚数を調整する
        const { drawDesk, revealDesk, drawCards } = CommonService.drawCard(desk, count);

        desk.drawDesk = drawDesk;
        desk.revealDesk = revealDesk;
        if (drawCards.length) {
          // カードを引くことができれば盤面に動きがあったとみなす
          desk.noPlayCount = 0;
        } else {
          // カードを引くことができなかったので盤面に動きが無かったとみなす
          desk.noPlayCount++;
        }
        desk.cardOfPlayer[timeoutPlayer] = CommonService.sortCardOfPlayer(
          desk.cardOfPlayer[timeoutPlayer].concat(drawCards),
        );

        // 次のプレイヤーに順番を回すためゲーム情報を整理する
        if ((desk.beforeCardPlay.special as Special) === Special.WILD_DRAW_4) {
          // 出したカードがワイルドドロー4の場合
          desk.cardAddOn += 4;
          desk.mustCallDrawCard = true;
        } else {
          // 出したカードがワイルドまたはシャッフルワイルドの場合
          desk.cardAddOn = 0;
          desk.mustCallDrawCard = false;
        }
        desk.beforePlayer = timeoutPlayer;
        const beforeCardPlay = {
          ...desk.beforeCardPlay,
          color: desk.colorBeforeWild,
        };
        desk.beforeCardPlay = beforeCardPlay;
        desk.numberCardPlay++;
        desk.yellUno[timeoutPlayer] = false;
        desk.restrictInterrupt = false;
        desk.hasYellUnoPenalty = {};
        desk.timeout[timeoutPlayer] = false;
        clearTimeout((<any>global)[timeoutPlayer]);

        // ゲーム情報更新
        await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));

        // ペナルティで引いたカードをプレイヤーに通知
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { SocketService } = require('./socket-io.service');
        const socketIdOfTimeoutPlayer = await redisClient.get(
          `${AppObject.REDIS_PREFIX.PLAYER}:${timeoutPlayer}`,
        );
        SocketService.sendCardToPlayer(socketIdOfTimeoutPlayer, {
          cards_receive: drawCards,
          is_penalty: true,
        });
        await BlueBird.delay(AppConst.TIMEOUT_DELAY);

        // ゲームログの出力: penalty
        await activityService.create({
          dealer_code: desk.id,
          event: 'penalty',
          dealer: desk.dealer,
          player: '',
          turn: desk.turn,
          contents: {
            player: timeoutPlayer,
            cards_receive: drawCards,
            number_turn_play: desk.numberTurnPlay,
            error: 'color-of-wild timeout',
          },
          desk: CommonService.deskLog(desk),
        } as any);

        // ペナルティを受けたことを全体に通知する
        SocketService.broadcastPenalty(desk.id, {
          player: timeoutPlayer,
          number_card_of_player: desk.cardOfPlayer[timeoutPlayer].length,
          error: 'color-of-wild timeout',
        });
        await BlueBird.delay(AppConst.TIMEOUT_DELAY);

        if (desk.noPlayCount >= AppConst.NO_PLAY_MAX_LAP * desk.players.length) {
          // 山札から引くことができた枚数 < 山札から引かないといけない枚数の場合、山札枯渇により対戦終了
          await CommonService.turnEnd(desk);
          return;
        }

        // 次のプレイヤーに手番を通知する
        const { nextPlayer, beforeCard, mustCallDrawCard, numberTurnPlay } =
          await CommonService.getNextPlayer(desk.id);
        const socketIdOfNextPlayer = await redisClient.get(
          `${AppObject.REDIS_PREFIX.PLAYER}:${nextPlayer}`,
        );

        // ゲームログの出力: next-player
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
    } catch (error) {
      getLogger('dealer', `${desk.id}`).error(`timeoutColorOfWild desk.timeout[${timeoutPlayer}]`);
    }
  }

  /**
   * 起点のプレイヤーからプレイ順り並べたリストを生成する
   * @param {string} nextPlayer 次のプレイヤーコード
   * @param {string[]} players 参加しているプレイヤーのコードリスト
   * @param {boolean} turnRight 右回りか
   * @returns {string[]}
   */
  public static getSortedPlayer(
    nextPlayer: string,
    players: string[],
    turnRight: boolean,
  ): string[] {
    const playerList = turnRight ? players : players.reverse();
    const index = playerList.findIndex((player) => player === nextPlayer); // 起点プレイヤーのインデックス
    /**
     * first: ①配列先頭から起点プレイヤーまで
     * second: ②起点プレイヤーの次から最終まで
     * second + first: ②＋①にすることで起点プレイヤーが最終になるリストを生成
     */

    const first = players.slice(0, index);
    const second = players.slice(index, players.length);
    return second.concat(first);
  }

  /**
   * 山札からカードを引く処理
   * @param {Desk} desk ゲーム情報
   * @param {number} count 引く枚数
   * @returns {{drawDesk: Card[]; revealDesk: Card[]; drawCards: Card[]}}
   */
  public static drawCard(
    desk: Desk,
    count: number,
  ): { drawDesk: Card[]; revealDesk: Card[]; drawCards: Card[] } {
    let { drawDesk, revealDesk } = cloneDeep(desk);
    const drawCards: Card[] = []; // 実際に弾くことができたカードのリスト
    for (let i = 0; i < count; i++) {
      if (drawDesk.length === 0) {
        // 山札からカードが無くなった時は、場札を山札に戻す
        const front = revealDesk.pop(); // 一番上の場札は場に残すので退避
        drawDesk = CommonService.shuffleDesk(revealDesk);
        revealDesk = cloneDeep([front]); // 場札を対比させたカードだけにして上書き
      }
      const card = drawDesk.pop(); // 1枚ずつカードを引く
      if (card) {
        // カードを引くことができたら、引いたカードリストに追加
        drawCards.push(card);
      }
    }

    return {
      drawDesk,
      revealDesk,
      drawCards: CommonService.sortCardOfPlayer(drawCards),
    };
  }

  /**
   * シャッフルワイルドによるカードの再配布
   * @param {Desk} desk ゲーム情報
   * @param {string} ignorePlayer 除外するプレイヤーコード
   * @returns {{desk: Desk; playersReceiveCard: string[];}}
   */
  public static shuffleWild(
    desk: Desk,
    ignorePlayer?: string,
  ): { desk: Desk; playersReceiveCard: string[] } {
    const { nextPlayer } = CommonService.preGetNextPlayer(desk);
    const playersReceiveCard = cloneDeep(desk.players);
    getLogger('dealer', `${desk.id}`).debug(
      `shuffleDesk playersReceiveCard ${JSON.stringify(playersReceiveCard)}`,
    );

    // プレイヤーコードリストから除外プレイヤーを排除
    const playersSorted = CommonService.getSortedPlayer(
      nextPlayer,
      playersReceiveCard,
      desk.turnRight,
    ).filter((player) => player !== ignorePlayer);
    getLogger('dealer', `${desk.id}`).debug(
      `player code list ${JSON.stringify(playersReceiveCard)}`,
    );
    getLogger('dealer', `${desk.id}`).debug(`turn right: ${desk.turnRight}`);
    getLogger('dealer', `${desk.id}`).debug(
      `shuffleDesk playersSorted ${JSON.stringify(playersSorted)}`,
    );

    let cardsShuffle: Card[] = [];
    // 全員の手札を回収
    for (const player of playersReceiveCard) {
      if (player === ignorePlayer) {
        continue;
      }

      const cardsPlayer = cloneDeep(desk.cardOfPlayer[player]);
      cardsShuffle = cardsShuffle.concat(cardsPlayer);
      desk.cardOfPlayer[player] = [];
    }
    cardsShuffle = CommonService.shuffleDesk(cardsShuffle);
    const len = playersSorted.length;
    const loopCnt = cardsShuffle.length;
    const cardOfPlayer = {};
    // 回収した手札を対象者に対して再配布
    for (let i = 0; i < loopCnt; i++) {
      const card = cardsShuffle.pop();
      const player = playersSorted[i % len];
      if (!cardOfPlayer[player]) {
        cardOfPlayer[player] = [];
      }

      getLogger('dealer', `${desk.id}`).debug(
        `shuffleDesk player: ${player}. card: ${JSON.stringify(card)}`,
      );
      cardOfPlayer[player].push(card);
    }

    for (const player of playersSorted) {
      desk.cardOfPlayer[player] = CommonService.sortCardOfPlayer(cardOfPlayer[player]);
    }

    return {
      desk,
      playersReceiveCard,
    };
  }

  /**
   * チャレンジが有効であるか判定する
   * @param {string} dealerId ディーラーコード
   * @param {Card} card ワイルドドロー4を出す前の場札
   * @param {Card[]} cardArrValidate ワイルドドロー4出したプレイヤーの手札
   * @returns {boolean}
   */
  public static isChallengeSuccessfully(
    dealerId: string,
    card: Card,
    cardArrValidate: Card[],
  ): boolean {
    getLogger('dealer', `${dealerId}`).info('isChallengeSuccessfully');

    let isCan = false;
    for (const cardValidate of cardArrValidate) {
      if (
        (cardValidate.special as Special) === Special.WILD ||
        (cardValidate.special as Special) === Special.WILD_SHUFFLE
      ) {
        isCan = true;
        break;
      }
      if ((cardValidate.color as Color) === (card.color as Color)) {
        isCan = true;
        break;
      }
      if (
        card.special &&
        [Special.DRAW_2, Special.REVERSE, Special.SKIP].indexOf(card.special as Special) > -1 &&
        (card.special as Special) === (cardValidate.special as Special)
      ) {
        isCan = true;
        break;
      }
      if (
        (cardValidate.number || Number(cardValidate.number) === 0) &&
        (cardValidate.number as Number) === (card.number as Number)
      ) {
        isCan = true;
        break;
      }
    }

    return isCan;
  }

  public static checkNextPlayer(player: string, nextPlayer: string) {
    return player === nextPlayer;
  }

  /**
   * 出したカードが手札に存在するか確認する
   * @param dealerId ディーラーコード
   * @param cardPlay 出したカード
   * @param cardsOfPlayer 手札
   * @returns
   */
  public static validateCardOfPlayer(dealerId: string, cardPlay: Card, cardsOfPlayer: Card[]) {
    getLogger('dealer', `${dealerId}`).debug(`cardPlay ${JSON.stringify(cardPlay)}`);
    getLogger('dealer', `${dealerId}`).debug(`cardOfPlayer ${JSON.stringify(cardsOfPlayer)}`);

    let isExist = false;
    for (const cardValidate of cardsOfPlayer) {
      if (cardPlay.special) {
        if (
          (cardPlay.color as Color) === (cardValidate.color as Color) &&
          (cardPlay.special as Special) === (cardValidate.special as Special)
        ) {
          isExist = true;
          break;
        }
      } else {
        if (
          (cardPlay.color as Color) === (cardValidate.color as Color) &&
          Number(cardPlay.number) === Number(cardValidate.number)
        ) {
          isExist = true;
          break;
        }
      }
    }

    return isExist;
  }

  /**
   * 最低参加者数を満たしているか判定する
   * @param socketIds 接続中のsocketIdリスト
   * @returns
   */
  public static canContinue(socketIds: string[]) {
    return socketIds.length < AppConst.MIN_PLAYER;
  }

  /**
   * 出したカードのバリデーションチェック
   * @param cardPlay 出したカード
   * @returns {BaseError | undefined}
   */
  public static hasValidateError(cardPlay: Card): BaseError | undefined {
    if (!cardPlay) {
      // 出したのカードの情報がない場合
      return new BaseError({ message: AppConst.CARD_PLAY_IS_REQUIRED });
    } else if (!cardPlay.number && cardPlay.number !== 0 && !cardPlay.special) {
      // 出したカードのnumberのフィールドがない（0が検知されないように注意） かつ specialのフィールドもない
      return new BaseError({ message: AppConst.PARAM_CARD_PLAY_INVALID });
    } else if (cardPlay.special && ARR_SPECIAL.indexOf(cardPlay.special as Special) === -1) {
      // specialフィールドの値が規定値ではない
      return new BaseError({ message: AppConst.SPECIAL_CARD_PLAY_INVALID });
    } else if (cardPlay.color && ARR_COLOR.indexOf(cardPlay.color as Color) === -1) {
      // colorフィールドの値が規定値ではない
      return new BaseError({ message: AppConst.COLOR_CARD_PLAY_INVALID });
    } else if (
      (cardPlay.number || cardPlay.number === 0) &&
      ARR_NUMBER.indexOf(cardPlay.number) === -1
    ) {
      // numberフィールドがあり0ではないが、規定の範囲内の数字ではない
      return new BaseError({ message: AppConst.NUMBER_CARD_PLAY_INVALID });
    }

    return;
  }

  /**
   * 場に出せるカードであるかを判定する
   * @param {Card} cardPlay 出したカード
   * @param {Card} cardBefore 場札のカード
   * @param {number} cardAddOn 引かないといけないカーdの枚数
   * @returns {boolean}
   */
  public static isAvailableCard(cardPlay: Card, cardBefore: Card, cardAddOn: number): boolean {
    let isValid = false;
    if (cardAddOn > 0) {
      return isValid;
    }
    if (ARR_WILD_SPECIAL.indexOf(cardPlay.special as Special) > -1) {
      isValid = true;
    } else if (cardPlay.special === Special.WHITE_WILD) {
      isValid = true;
    } else if (
      cardPlay.special &&
      (cardPlay.special as Special) === (cardBefore.special as Special)
    ) {
      isValid = true;
    } else if ((cardPlay.color as Color) === (cardBefore.color as Color)) {
      isValid = true;
    } else if (
      (cardPlay.number || Number(cardPlay.number) === 0) &&
      Number(cardPlay.number) === Number(cardBefore.number)
    ) {
      isValid = true;
    }

    return isValid;
  }

  /**
   * 手札から出したカードを排除する
   * @param {Card} cardPlay 出したカード
   * @param {Card[]} cardsOfPlayer 手札
   * @returns {Card[]} カードを排除した後の手札
   */
  public static removeCardOfPlayer(cardPlay: Card, cardsOfPlayer: Card[]) {
    let isRemove = false;
    const newCardsOfPlayer: Card[] = [];
    for (const cardValidate of cardsOfPlayer) {
      if (isRemove) {
        newCardsOfPlayer.push(cardValidate);
        continue;
      } else if (cardPlay.special) {
        if (
          (cardPlay.color as Color) === (cardValidate.color as Color) &&
          (cardPlay.special as Special) === (cardValidate.special as Special)
        ) {
          isRemove = true;
          continue;
        } else {
          newCardsOfPlayer.push(cardValidate);
          continue;
        }
      } else {
        if (
          (cardPlay.color as Color) === (cardValidate.color as Color) &&
          Number(cardPlay.number) === Number(cardValidate.number)
        ) {
          isRemove = true;
          continue;
        } else {
          newCardsOfPlayer.push(cardValidate);
          continue;
        }
      }
    }

    return newCardsOfPlayer;
  }

  /**
   * 各プレイヤーの手札所持数を生成する
   * @param {Desk} desk ゲーム情報
   * @returns {{[key: string]: number}}
   */
  public static getCardCountOfPlayers = (desk: Desk): { [key: string]: number } => {
    const numberCardOfPlayer: any = {};
    const players: string[] = desk.players || [];
    const cardOfPlayer = desk.cardOfPlayer;
    for (const player of players) {
      numberCardOfPlayer[player] = cardOfPlayer[player].length;
    }
    return numberCardOfPlayer;
  };

  /**
   * カードを引く理由を取得する
   * @param {Desk} desk ゲーム情報
   * @param {string} player プレイヤーコード
   * @returns {DrawReason} カードを引く理由
   */
  public static getDrawReason = (desk: Desk, player: string): DrawReason => {
    let drawReason = DrawReason.NOTHING; // デフォルトは理由なしとする
    if (desk.mustCallDrawCard) {
      if (desk.activationWhiteWild && desk.activationWhiteWild[player] > 0) {
        // 白いワイルドの効果を受ける残回数がある場合
        switch (desk.whiteWild) {
          case WhiteWild.BIND_2:
            drawReason = DrawReason.BIND_2; // バインド2
            break;
          case WhiteWild.SKIP_BIND_2:
            drawReason = DrawReason.SKIP_BIND_2; // スキップバインド2
            break;
        }
      } else if (desk.cardAddOn > 0) {
        // 前のプレイヤーの出したカードによってカードを引く場合
        // 場札のカードで理由を判定する
        if (desk.beforeCardPlay.special === Special.DRAW_2) {
          drawReason = DrawReason.DRAW_2;
        } else if (desk.beforeCardPlay.special === Special.WILD_DRAW_4) {
          drawReason = DrawReason.WILD_DRAW_4;
        }
      }
    }
    return drawReason;
  };

  /**
   *
   * @param {Desk} desk プレイヤーの得点をMongoに保存する
   */
  public static async storeScoreOfPlayerFinishGame(desk: Desk) {
    const score = desk.score;
    const players: string[] = desk.players || [];
    for (const player of players) {
      const playerFound = await playerService.detailByCondition({ code: player });
      if (playerFound) {
        playerFound.total_score = playerFound.total_score || 0;
        playerFound.total_score += score[player];
        await playerFound.save();
      }
    }
  }

  /**
   * 対戦が終了しているか判定する
   * @param {Desk} desk ゲーム情報
   * @param {string} player 現在の手番のプレイヤーコード
   * @param {Card} cardPlay 最後に出したカード
   * @param {boolean} isColorOfWild color-of-wildの処理内か
   * @returns
   */
  public static isTurnEnd(desk: Desk, player: string, cardPlay?: Card, isColorOfWild?: boolean) {
    const cards = desk.cardOfPlayer[player]; // 現在の手番プレイヤーの手札
    if (cardPlay) {
      if ((cardPlay.special as Special) === Special.WILD_SHUFFLE) {
        // 出したカードがシャッフルワイルドの場合、シャッフル処理と色の変更処理を行ってから終了となるのでこのタイミングでは終了判定にしない
        return false;
      }

      if (cardPlay.special === Special.WHITE_WILD) {
        // 白いワイルドの効果がターン終了時に影響を与える場合の処理
        switch (desk.whiteWild) {
          case WhiteWild.BIND_2:
          case WhiteWild.SKIP_BIND_2:
            // バインド2 および スキップバインド2ではカードを出したら終了とし、カードの効果は発動させない
            return cards.length === 0;
          default:
            return cards.length === 0;
        }
      }

      return cards.length === 0;
    } else if (isColorOfWild) {
      return cards.length === 0;
    }

    // 上記に該当しない場合は対戦が終了していない
    return false;
  }

  /**
   * ターン終了時の特定計算を行う
   * 勝者なしで対戦が終わることもある
   * @param {Desk} desk ゲーム情報
   * @param {string} winPlayer 勝者のプレイヤーコード
   * @returns
   */
  public static async calculateScoreOfPlayerFinishTurn(desk: Desk, winPlayer?: string) {
    const order = cloneDeep(desk.order);
    const score = cloneDeep(desk.score);
    const players: string[] = desk.players || [];
    let winner: string;
    const losers: string[] = [];
    const scoreOfLoser = {};
    let scoreOfWinner = 0;

    // プレイヤーごとに得点を計算
    for (const player of players) {
      const cardOfPlayer = desk.cardOfPlayer[player];
      if (winPlayer && cardOfPlayer.length === 0) {
        winner = player;
      } else {
        scoreOfLoser[player] = 0;
        losers.push(player);
      }
    }

    // 敗者の得点を集計
    for (const loser of losers) {
      const cardOfPlayer = desk.cardOfPlayer[loser];
      for (const card of cardOfPlayer) {
        if (card.special) {
          scoreOfLoser[loser] -= AppConst.SCORE[card.special];
        } else {
          scoreOfLoser[loser] -= AppConst.SCORE[card.number];
        }
      }
      // 敗者が減点された分のポイントが勝者のポイントとなる
      scoreOfWinner = scoreOfWinner + -scoreOfLoser[loser];
    }

    if (winPlayer) {
      // 勝者の勝ち数更新
      order[winner]++;
    }

    for (const player of players) {
      if (player === winner) {
        score[player] += scoreOfWinner;
      } else {
        score[player] += scoreOfLoser[player];
      }
    }

    desk.order = Object.keys(order)
      .sort((a, b) => order[b] - order[a])
      .reduce(
        (_obj, key) => ({
          ..._obj,
          [key]: order[key],
        }),
        {},
      );
    desk.score = Object.keys(score)
      .sort((a, b) => score[b] - score[a])
      .reduce(
        (_obj, key) => ({
          ..._obj,
          [key]: score[key],
        }),
        {},
      );

    // Mongoのプレイヤー情報を更新
    for (const player of players) {
      const playerFound = await playerService.detailByCondition({ code: player });
      if (playerFound) {
        if (!playerFound.score) {
          playerFound.score = {};
        }
        if (!playerFound.score[desk.id]) {
          playerFound.score[desk.id] = [];
        }
        const currentTurnScore = winner === player ? scoreOfWinner : scoreOfLoser[player];
        playerFound.score[desk.id].push(currentTurnScore);
        playerFound.markModified(`score.${desk.id}`);
        await playerFound.save();
      }
    }

    const currentTrunResult = {
      ...scoreOfLoser,
    };

    if (winner) {
      currentTrunResult[winner] = scoreOfWinner;
    }

    return { score: currentTrunResult };
  }

  /**
   * 試合終了時の総得点集計
   * @param {Desk} desk ゲーム情報
   * @returns {Primise<string>}
   */
  public static async calculateWinnerOfGame(desk: Desk): Promise<string> {
    // スコアの降順にプレイヤーコードを並び替える
    const ranking: { player: string; score: number }[] = Object.keys(desk.score)
      .map((player) => {
        return { player, score: desk.score[player] };
      })
      .sort((a, b) => {
        return b.score - a.score;
      });

    const winScore = ranking[0].score; // 先頭が優勝者
    const winners = ranking.filter((data) => data.score >= winScore); // 同スコアを抽出
    if (winners.length === 1) {
      // トップのスコアが1人しかいない場合はそのまま優勝者とする
      return winners[0].player;
    } else {
      // トップのスコアが複数人いた場合は、先にその点数に到達したほうを優勝とする
      const histories: { [key: string]: number } = {}; // ハイスコアに到達した対戦数を保持
      for (const data of winners) {
        const playerFound = await playerService.detailByCondition({ code: data.player });
        const history = playerFound.score[desk.id];
        const list = [];
        history.reduce((sum: number, score: number, i: number) => {
          if (i === 0) {
            list.push(score);
            return score;
          }

          const result = sum + score;
          list.push(result);

          return result;
        }, 0);
        const index = list.findIndex((sum) => {
          return sum >= winScore;
        });
        histories[data.player] = index;
      }

      return Object.keys(histories).sort((a, b) => histories[a] - histories[b])[0];
    }
  }

  /**
   * 対戦終了時の処理
   * @param {Desk} desk ゲーム情報
   * @param {string} winPlayer 勝者
   * @returns
   */
  public static async turnEnd(desk: Desk, winPlayer?: string) {
    getLogger('dealer', `${desk.id}`).info(
      `Finish turn ${desk.turn}. winner: ${winPlayer || null}. lastCard: ${JSON.stringify(
        desk.beforeCardPlay,
      )}`,
    );
    desk.timeout[desk.nextPlayer] = false;
    desk.players.forEach((player) => {
      clearTimeout((<any>global)[player]);
    });

    // 対戦終了時のスコアを計算する
    const { score } = await CommonService.calculateScoreOfPlayerFinishTurn(desk, winPlayer);

    // ゲームログの出力: finish-turn
    await activityService.create({
      dealer_code: desk.id,
      event: SocketConst.EMIT.FINISH_TURN,
      dealer: desk.dealer,
      player: '',
      turn: desk.turn,
      contents: {
        winner: winPlayer,
        score,
        total_score: desk.score,
        number_turn_play: desk.numberTurnPlay,
        card_of_player: desk.cardOfPlayer,
      },
      desk: CommonService.deskLog(desk),
    } as any);

    // ゲーム情報更新
    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${desk.id}`, JSON.stringify(desk));

    // 対戦終了を全体に通知する
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SocketService } = require('./socket-io.service');
    SocketService.broadcastFinishTurn(desk.id, {
      winner: winPlayer || '',
      turn_no: desk.turn,
      score,
    });

    // 対戦数・勝ち数・得点を保存
    await dealerService.updateByCondition({
      conditions: { code: desk.id },
      data: {
        $set: {
          turn: desk.turn,
          order: desk.order,
          score: desk.score,
        },
      },
    });
    await BlueBird.delay(AppConst.TIMEOUT_DELAY);

    if (desk.turn >= desk.totalTurn) {
      // 総対戦数が終了したので試合を終了する
      try {
        // 試合終了時の勝者を決める
        const winner = await CommonService.calculateWinnerOfGame(desk);

        // ゲームログの出力: finish-game
        await activityService.create({
          dealer_code: desk.id,
          event: SocketConst.EMIT.FINISH_GAME,
          dealer: desk.dealer,
          player: '',
          turn: desk.turn,
          contents: {
            winner,
            order: desk.order,
            score: desk.score,
          },
          desk: CommonService.deskLog(desk),
        } as any);

        // 試合が終了したことを全体に通知する
        SocketService.broadcastFinishGame(desk.id, {
          winner,
          turn_win: desk.order[winner],
          order: desk.order,
          total_score: desk.score,
        });

        // スコアを保存する
        await CommonService.storeScoreOfPlayerFinishGame(desk);
        await dealerService.updateByCondition({
          conditions: { code: desk.id },
          data: { $set: { status: StatusGame.FINISH } },
        });

        // socket通信を切断する
        const players = desk.players || [];
        for (const player of players) {
          const socketIdOfPlayer = await redisClient.get(
            `${AppObject.REDIS_PREFIX.PLAYER}:${player}`,
          );
          const _sock = SocketService.getSocketById(socketIdOfPlayer);
          _sock.disconnect(true);
        }
      } catch (e) {
        getLogger('dealer', `${desk.id}`).error(e);
      }
      return;
    }

    // 次の対戦開始
    await CommonService.startDealer(desk.id, undefined, false);
    return;
  }

  /**
   * 対戦開始
   * @param {string} dealerCode ディーラーコード
   * @param {DealerModel} dealer ゲーム情報
   * @param {boolean} isFirstStart 1対戦目の開始であるか
   * @returns {Promise<Desk>} ゲーム情報
   */
  public static async startDealer(
    dealerCode: string,
    dealer: DealerModel,
    isFirstStart: boolean,
  ): Promise<Desk> {
    if (!dealer) {
      // ゲーム情報がなかった時は、Mongoから最新の情報を取得する
      dealer = await dealerService.detailByCondition({ code: dealerCode });
    }
    const players = shuffle(dealer.players) || []; // プレイヤーの順番をシャッフルする
    if (players.length < AppConst.MIN_PLAYER) {
      // 参加者数がゲーム継続人数に足りない時エラーとし、処理を中断する
      throw new BaseError({ message: AppConst.NUMBER_OF_PLAYER_JOIN_DEALER_LOWER_TWO });
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SocketService } = require('./socket-io.service');
    const socketIds: string[] = await SocketService.getAllClientOfRoom(dealer.code);
    if (socketIds.length < AppConst.MIN_PLAYER) {
      // 接続者数がゲーム継続人数に足りない時エラーとし、処理を中断する
      throw new BaseError({ message: AppConst.NUMBER_OF_SOCKET_CLIENT_JOIN_DEALER_LOWER_TWO });
    }

    // 参加者のsocket通信情報のマップを生成する
    const mapPlayerToSocket = new Map<string, string>();
    for (const player of players) {
      const socketId = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${player}`);
      if (!socketId) {
        throw new BaseError({ message: `Can not get socket id of player ${player}.` });
      } else if (socketIds.indexOf(socketId) === -1) {
        throw new BaseError({ message: `Socket id ${socketId} don't member room ${dealer.name}.` });
      }
      mapPlayerToSocket.set(player, socketId);
    }

    // ゲーム情報の初期化
    const desk = CommonService.initDesk(!!dealer.whiteWild);
    getLogger('dealer', `${dealerCode}`).debug(`whiteWild ${dealer.whiteWild}`);
    const { cards, mapPlayer } = CommonService.deal(desk, players);

    // 前の対戦の情報をリセットし、カードを配布する
    const cardOfPlayer: any = {};
    const yellUno: any = {};
    const timeout: any = {};
    for (const player of players) {
      const socketId = mapPlayerToSocket.get(player);
      const cards = mapPlayer.get(player);
      SocketService.sendCardToPlayer(socketId, { cards_receive: cards, is_penalty: false });

      cardOfPlayer[player] = CommonService.sortCardOfPlayer(cards);
      yellUno[player] = false;
      timeout[player] = false;
    }

    let deskInfo: Desk = JSON.parse(
      await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealer.code}`),
    );

    const turn = isFirstStart ? 1 : deskInfo.turn + 1; // 2対戦目以降は対戦数を加算する
    await BlueBird.delay(AppConst.TIMEOUT_DELAY);

    let order: any = {};
    let score: any = {};
    const firstPlayer = players[0];
    if (isFirstStart) {
      // 1対戦目の時は勝数とスコアを初期化する
      for (const player of players) {
        order[player] = 0;
        score[player] = 0;
      }
    } else {
      // 2対戦目以降は前の対戦の情報を引き継ぐ
      order = deskInfo.order;
      score = deskInfo.score;
    }

    // broadcast first player
    const { newCards, firstCard } = CommonService.getFirstCard(cards); // 最初のカードを決める

    getLogger('dealer', `${dealerCode}`).info(`isFirstStart ${isFirstStart}`);
    getLogger('dealer', `${dealerCode}`).info(`Start turn ${turn}`);
    getLogger('dealer', `${dealerCode}`).info(`firstPlayer ${firstPlayer}`);
    getLogger('dealer', `${dealerCode}`).info(`firstCard ${JSON.stringify(firstCard)}`);

    // 対戦開始を通知する
    SocketService.broadcastFirstPlayer(dealer.code, {
      first_player: firstPlayer,
      first_card: firstCard,
      play_order: players,
      total_turn: dealer.totalTurn,
      white_wild: dealer.whiteWild,
    });

    // ゲームログの出力: first-player
    await activityService.create({
      dealer_code: dealerCode,
      event: SocketConst.EMIT.FIRST_PLAYER,
      dealer: dealer.name,
      player: '',
      turn,
      contents: {
        white_wild: dealer.whiteWild,
        first_player: firstPlayer,
        first_card: firstCard,
        play_order: players,
        cards_receive: cardOfPlayer,
      },
      desk: CommonService.deskLog({
        ...deskInfo,
        cardOfPlayer,
        beforeCardPlay: firstCard,
        yellUno,
        turnRight: true,
        revealDesk: [firstCard],
        drawDesk: newCards,
      }), // desk情報更新前に書き出すので部分的に上書きしておく
    } as any);
    await BlueBird.delay(AppConst.TIMEOUT_DELAY);

    // 最初のカードがワイルドの場合は最初のプレイヤーが色の選択を行うが、色選択処理が正常に行われなかった時はランダムな値でスタートするので事前に色をセットしておく
    const colorIndex = CommonService.randomByNumber(4);
    const colorBeforeWild = ARR_COLOR[colorIndex];

    // 最初のカードの効果をゲーム盤面に反映する
    let cardAddOn = 0;
    let mustCallDrawCard = false;
    if ((firstCard.special as Special) === Special.DRAW_2) {
      cardAddOn = 2;
      mustCallDrawCard = true;
    }
    let isSkip = false;
    if ((firstCard.special as Special) === Special.SKIP) {
      isSkip = true;
    }
    deskInfo = {
      id: dealer.code,
      dealer: dealer.name,
      players,
      status: StatusGame.STARTING,
      drawDesk: newCards,
      revealDesk: [firstCard],
      turn,
      totalTurn: dealer.totalTurn,
      firstPlayer,
      beforePlayer: firstPlayer,
      nextPlayer: null,
      turnRight: true,
      cardOfPlayer,
      cardAddOn,
      canCallPlayDrawCard: false,
      mustCallDrawCard,
      beforeCardPlay: firstCard,
      colorBeforeWild,
      whiteWild: dealer.whiteWild,
      activationWhiteWild: {},
      order,
      score,
      yellUno,
      timeout,
      isSkip,
      numberTurnPlay: 1,
      numberCardPlay: 1,
      noPlayCount: 0,
      specialLogic: {},
      restrictInterrupt: false,
      hasYellUnoPenalty: {},
    };

    if ((firstCard.special as Special) === Special.REVERSE) {
      deskInfo.turnRight = !deskInfo.turnRight;
    }
    if ((firstCard.special as Special) === Special.SKIP) {
      deskInfo.isSkip = true;
    }
    await redisClient.set(
      `${AppObject.REDIS_PREFIX.DESK}:${dealer.code}`,
      JSON.stringify(deskInfo),
    );

    // 最初のカードによるアクションを行う
    await CommonService.firstPlayerAction(deskInfo, firstCard, firstPlayer, mapPlayerToSocket);

    // ステータスを更新しMongoに保存
    dealer.status = StatusGame.STARTING;
    await dealer.save();

    return JSON.parse(await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealer.code}`));
  }

  /**
   * 共通エラー処理
   * @param {string} dealerId ディーラーコード
   * @param {any} err エラーオブジェクト
   * @param {CallbackWithData<any>} callback コールバック
   */
  public static handleError(dealerId: string, err: any, callback: CallbackWithData<any>) {
    if (callback instanceof Object) {
      callback(err, undefined);
    }
    if ((APP_CONFIG.ENV.NAME as Environment) !== Environment.test) {
      getLogger('dealer', `${dealerId}`).error(`handleError ${err}`);
    }
  }

  /**
   * コマンドログを出力する
   * @param socketId
   * @param event
   * @param param
   */
  public static async loggingCommand(socketId: string, event: string, param: any) {
    const player = await redisClient.get(`${AppObject.REDIS_PREFIX.PLAYER}:${socketId}`);
    const dealer = await redisClient.get(`${AppObject.REDIS_PREFIX.ROOM}:${player}:${socketId}`);
    getLogger('command', dealer).info({ player, event, param });
  }

  /**
   * ゲームログ出力用に手札をソートする
   * @param {Card[]} cardOfPlayer 手札
   * @returns {Card[]} ソート後の手札
   */
  public static sortCardOfPlayer(cardOfPlayer: Card[]): Card[] {
    return cardOfPlayer.sort((a, b) => {
      const aCardColorIndex = SORT_ORDER.findIndex((color) => color === a.color);
      const bCardColorIndex = SORT_ORDER.findIndex((color) => color === b.color);

      if (aCardColorIndex !== bCardColorIndex) {
        return aCardColorIndex > bCardColorIndex ? 1 : -1;
      }

      if (a.number !== b.number) {
        return a.number - b.number;
      }

      if (a.special !== b.special) {
        return a.special > b.special ? 1 : -1;
      }

      return 0;
    });
  }

  /**
   * ゲームログ出力用に場札・手札の情報を整理する
   * @param {Desk} desk ゲーム情報
   * @param {{[key: string]: Card[]}} ignoreCard 手札から排除するカード
   * @returns {{before_card_play: Card;
   *            card_of_player: {[key: string]: Card[]};
   *            yell_uno: {[key: string]: boolean};
   *            turn_right: boolean;
   *            draw_desk_number: number;
   *            reveal_desk_number: number;
   *          }}
   */
  public static deskLog(
    desk: Desk,
    ignoreCard?: { [key: string]: Card[] },
  ): {
    before_card_play: Card;
    card_of_player: { [key: string]: Card[] };
    yell_uno: { [key: string]: boolean };
    turn_right: boolean;
    draw_desk_number: number;
    reveal_desk_number: number;
  } {
    const cardOfPlayer = cloneDeep(desk.cardOfPlayer);

    if (ignoreCard) {
      // ログ出力時点で手札の情報が更新されていない場合があるので、ignoreCardと突き合わせて調整する
      Object.keys(ignoreCard).forEach((player) => {
        const cards = cloneDeep(cardOfPlayer[player]);
        for (const ignore of ignoreCard[player]) {
          const index = cards.findIndex((card) => isEqual(card, ignore));
          if (!Number.isNaN(index)) {
            cards.splice(index, 1);
          }
        }
        cardOfPlayer[player] = cards;
      });
    }

    return {
      before_card_play: desk.beforeCardPlay,
      card_of_player: cardOfPlayer,
      yell_uno: desk.yellUno,
      turn_right: desk.turnRight,
      draw_desk_number: desk.drawDesk?.length,
      reveal_desk_number: desk.revealDesk?.length,
    };
  }
}
