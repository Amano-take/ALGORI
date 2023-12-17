/**
 * テスト用関数群
 */
import * as mongoose from 'mongoose';

import { AppObject } from './consts/app.object';
import { Card, Color, Desk, Special, StatusGame } from './consts/app.enum';
import redisClient from '../configs/database/redis.config';
import { CommonService } from './common.service';

export class TestService {
  /**
   * DBリセット
   * @returns {Promise<any>}
   */
  public static async resetDb(): Promise<any> {
    await redisClient.flushdb();
    return mongoose.connection.dropDatabase();
  }

  public static getDefaultDesk = (Consts) => {
    return {
      id: '', // 途中でIDが変わるので仮置き
      dealer: Consts.DEALER_2_NAME,
      players: [Consts.PLAYER_1, Consts.PLAYER_2, Consts.PLAYER_3, Consts.PLAYER_4],
      status: StatusGame.STARTING,
      firstPlayer: Consts.PLAYER_1,
      totalTurn: Consts.TOTAL_TURN,
      turn: 1,
      beforePlayer: Consts.PLAYER_4,
      nextPlayer: Consts.PLAYER_1,
      beforeCardPlay: {
        color: Color.RED,
        number: 1,
      },
      cardOfPlayer: {
        [Consts.PLAYER_1]: [
          { color: Color.YELLOW, number: 2 },
          { color: Color.YELLOW, number: 6 },
          { color: Color.GREEN, number: 1 },
          { color: Color.GREEN, special: Special.DRAW_2 },
          { color: Color.BLUE, number: 2 },
          { color: Color.RED, number: 9 },
          { color: Color.BLACK, special: Special.WILD_DRAW_4 },
        ],
        [Consts.PLAYER_2]: [
          { color: Color.YELLOW, special: Special.DRAW_2 },
          { color: Color.GREEN, number: 0 },
          { color: Color.GREEN, number: 9 },
          { color: Color.BLUE, number: 4 },
          { color: Color.BLUE, number: 5 },
          { color: Color.BLUE, number: 7 },
          { color: Color.RED, number: 1 },
        ],
        [Consts.PLAYER_3]: [
          { color: Color.YELLOW, special: Special.REVERSE },
          { color: Color.YELLOW, number: 1 },
          { color: Color.YELLOW, number: 9 },
          { color: Color.GREEN, number: 2 },
          { color: Color.GREEN, number: 7 },
          { color: Color.BLUE, special: Special.DRAW_2 },
          { color: Color.RED, number: 7 },
        ],
        [Consts.PLAYER_4]: [
          { color: Color.YELLOW, number: 3 },
          { color: Color.YELLOW, number: 4 },
          { color: Color.YELLOW, number: 5 },
          { color: Color.GREEN, number: 5 },
          { color: Color.GREEN, number: 8 },
          { color: Color.BLUE, number: 6 },
          { color: Color.RED, number: 6 },
        ],
      },
      cardAddOn: 0,
      turnRight: true,
      isSkip: false,
      mustCallDrawCard: false,
      canCallPlayDrawCard: false,
      drawDesk: [
        { color: Color.YELLOW, special: Special.SKIP },
        { color: Color.BLUE, number: 2 },
        { color: Color.RED, special: Special.DRAW_2 },
        { color: Color.YELLOW, number: 3 },
        { color: Color.BLACK, special: Special.WILD },
        { color: Color.BLUE, number: 8 },
        { color: Color.RED, number: 7 },
        { color: Color.RED, number: 4 },
        { color: Color.WHITE, special: Special.WHITE_WILD },
        { color: Color.YELLOW, number: 8 },
        { color: Color.YELLOW, number: 7 },
        { color: Color.GREEN, number: 2 },
        { color: Color.RED, number: 3 },
        { color: Color.RED, number: 4 },
        { color: Color.GREEN, number: 7 },
        { color: Color.RED, number: 5 },
        { color: Color.BLACK, special: Special.WILD_SHUFFLE },
        { color: Color.WHITE, special: Special.WHITE_WILD },
        { color: Color.BLUE, number: 5 },
        { color: Color.RED, special: Special.SKIP },
        { color: Color.RED, number: 3 },
        { color: Color.BLUE, number: 3 },
        { color: Color.GREEN, special: Special.DRAW_2 },
        { color: Color.BLUE, special: Special.SKIP },
        { color: Color.BLACK, special: Special.WILD },
        { color: Color.RED, number: 6 },
        { color: Color.RED, number: 8 },
        { color: Color.GREEN, special: Special.REVERSE },
        { color: Color.YELLOW, number: 8 },
        { color: Color.RED, special: Special.REVERSE },
        { color: Color.YELLOW, number: 1 },
        { color: Color.GREEN, number: 1 },
        { color: Color.GREEN, number: 4 },
        { color: Color.RED, number: 9 },
        { color: Color.BLACK, special: Special.WILD_DRAW_4 },
        { color: Color.RED, special: Special.SKIP },
        { color: Color.YELLOW, number: 0 },
        { color: Color.BLACK, special: Special.WILD },
        { color: Color.BLUE, number: 7 },
        { color: Color.GREEN, number: 6 },
        { color: Color.RED, special: Special.REVERSE },
        { color: Color.RED, number: 0 },
        { color: Color.GREEN, special: Special.SKIP },
        { color: Color.BLACK, special: Special.WILD_DRAW_4 },
        { color: Color.GREEN, number: 4 },
        { color: Color.YELLOW, special: Special.SKIP },
        { color: Color.GREEN, special: Special.SKIP },
        { color: Color.BLUE, number: 9 },
        { color: Color.BLUE, special: Special.DRAW_2 },
        { color: Color.YELLOW, number: 6 },
        { color: Color.BLUE, special: Special.REVERSE },
        { color: Color.BLACK, special: Special.WILD_DRAW_4 },
        { color: Color.YELLOW, number: 9 },
        { color: Color.YELLOW, number: 5 },
        { color: Color.RED, number: 2 },
        { color: Color.BLUE, special: Special.SKIP },
        { color: Color.GREEN, number: 3 },
        { color: Color.BLUE, number: 0 },
        { color: Color.GREEN, special: Special.REVERSE },
        { color: Color.YELLOW, number: 4 },
        { color: Color.GREEN, number: 5 },
        { color: Color.BLUE, number: 8 },
        { color: Color.RED, number: 2 },
        { color: Color.YELLOW, special: Special.DRAW_2 },
        { color: Color.BLUE, number: 6 },
        { color: Color.RED, number: 5 },
        { color: Color.GREEN, number: 9 },
        { color: Color.WHITE, special: Special.WHITE_WILD },
        { color: Color.BLUE, special: Special.REVERSE },
        { color: Color.BLUE, number: 3 },
        { color: Color.BLUE, number: 1 },
        { color: Color.BLACK, special: Special.WILD },
        { color: Color.YELLOW, special: Special.REVERSE },
        { color: Color.RED, special: Special.DRAW_2 },
        { color: Color.GREEN, number: 8 },
        { color: Color.YELLOW, number: 7 },
        { color: Color.RED, number: 8 },
        { color: Color.BLUE, number: 4 },
        { color: Color.BLUE, number: 9 },
        { color: Color.BLUE, number: 1 },
        { color: Color.YELLOW, number: 2 },
        { color: Color.GREEN, number: 3 },
        { color: Color.GREEN, number: 6 },
      ],
      revealDesk: [{ color: Color.RED, number: 1 }],
      order: {},
      score: {},
      yellUno: {},
      timeout: {},
      noPlayCount: 0,
      numberCardPlay: 0,
      numberTurnPlay: 0,
      restrictInterrupt: false,
    };
  };

  /**
   * ゲーム情報セット
   * @param {any} data ゲーム情報
   * @returns {Promise<Desk>} 更新後のゲーム情報
   */
  public static async setDesk(data: any): Promise<Desk> {
    const desk: Desk = JSON.parse(
      await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${data.id}`),
    );

    const deskInfo = {
      ...desk,
      ...data,
    };

    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${data.id}`, JSON.stringify(deskInfo));

    return deskInfo;
  }

  /**
   * 山札にカードを追加
   * @param {string} dealerId ディーラーコード
   * @param {Card[]} cards 追加するカードリスト
   * @returns {Promise<Desk>} ゲーム情報
   */
  public static async pushCardToDesk(dealerId: string, cards: Card[]): Promise<Desk> {
    const desk: Desk = JSON.parse(
      await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
    );
    for (const card of cards) {
      desk.drawDesk.push(card);
    }

    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));
    return desk;
  }

  /**
   * 手札をセット
   * @param {string} dealerId ディーラーコード
   * @returns {Promise<Desk>} ゲーム情報
   */
  public static async setCardOfDesk(dealerId: string): Promise<Desk> {
    const desk: Desk = JSON.parse(
      await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
    );
    desk.drawDesk = CommonService.desk();
    desk.revealDesk = [];
    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));
    return desk;
  }

  /**
   * 勝数と対戦数を
   * @param {string} dealerId ディーラーコード
   * @param {number} turn 対戦数
   * @param  {{[key: string]: number}} order 勝ち数
   * @returns {Promise<Desk>} ゲーム情報
   */
  public static async setOrderOfDesk(
    dealerId: string,
    turn: number,
    order: {
      [key: string]: number;
    },
  ): Promise<Desk> {
    const desk: Desk = JSON.parse(
      await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`),
    );
    if (turn) {
      desk.turn = turn;
    }
    if (order) {
      desk.order = order;
    }

    await redisClient.set(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`, JSON.stringify(desk));
    return desk;
  }

  /**
   * ゲーム情報取得
   * @param {string} dealerId ディーラーコード
   * @returns {Promise<Desk>} ゲーム情報
   */
  public static async getDesk(dealerId: string): Promise<Desk> {
    return JSON.parse(await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealerId}`));
  }
}
