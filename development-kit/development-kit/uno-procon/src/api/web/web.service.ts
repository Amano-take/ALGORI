/**
 * Web serivice
 * 管理ツールの操作を行うサービスクラス
 */
import * as fs from 'fs';
import sanitize = require('sanitize-filename');

import { DealerService } from '../dealer/dealer.service';
import { Utils, getLogger } from '../../libs/commons';
import { PlayerService } from '../player/player.service';
import { DealerModel } from '../dealer/dealer.model';
import { Players } from '../player/player.collection';
import { PlayerModel } from '../player/player.model';
import { ActivityService } from '../activity/activity.service';
import { SocketConst } from '../../commons/consts/socket.const';
import { BaseError } from '../../libs/standard';
import { AppConst } from '../../commons/consts/app.const';

const activityService = new ActivityService();
const dealerService = new DealerService();
const playerService = new PlayerService();
const util = new Utils();

export class WebService {
  #dirty: boolean; // プライベート変数に変更があったか
  #oneTimeToken: string; // ワンタイムトークン

  constructor() {
    this.#dirty = false;
    this.#oneTimeToken = util.createRandomeStr(32);
  }

  /**
   * 変更状態を取得する
   */
  getDirty() {
    return this.#dirty;
  }

  /**
   * トークン取得
   * @returns {string}
   */
  getOneTimeToken(): string {
    return this.#oneTimeToken;
  }

  /**
   * トークン更新
   * @returns {string}
   */
  setOneTimeToken(): string {
    this.#dirty = true;
    this.#oneTimeToken = util.createRandomeStr(32);
    return this.#oneTimeToken;
  }

  /**
   * ディーラー一覧取得
   * @param {number} page ページ数
   * @returns
   */
  public async list(page: number) {
    const params: any = {
      paginate: { page },
      order: 'desc',
    };

    try {
      // 指定したページに該当するディーラー一覧を取得
      const data = await dealerService.list(params).catch((error) => {
        throw error;
      });

      // 指定したページに該当する試合に参加しているプレイヤーコードを抽出
      const playerCodes = [
        ...new Set(data.data.map((dealer: DealerModel) => dealer.players).flat(1)),
      ];
      // プレイヤーコードからプレイヤードキュメントを取得
      const playerList = await Players.find({
        code: { $in: playerCodes.map((playerCode) => playerCode) },
      });
      // プレイヤー情報のマップを生成
      const players = playerList.reduce(
        (obj: { [key: string]: PlayerModel }, item: PlayerModel) => ((obj[item.code] = item), obj),
        {},
      );

      return {
        ...data,
        players,
      };
    } catch (e) {
      getLogger('admin', '').error(e);
      throw e;
    }
  }

  /**
   * ゲームログの取得
   * @param {string} code ディーラーコード
   * @param {string[]} data.event 行動タイプリスト
   * @param {number} turn 対戦数
   * @returns
   */
  public async log(code: string, data: { event: string[] }, turn: number) {
    // ディーラーを取得
    const game = await dealerService.detailByCondition({ code });
    if (!game) {
      throw new BaseError({ message: AppConst.DEALER_NOT_FOUND });
    }

    // 参加しているプレイヤー情報を取得
    const allPlayers = [];
    for (let i = 0; i < game.players.length; i++) {
      const player = await playerService.detailByCondition({ code: game.players[i] });
      allPlayers.push(player);
    }

    const { event } = data;
    const condition: {
      paginate: { pageSize?: number };
      order?: 'asc' | 'desc';
      lang?: string;
      conditions: {
        dealer_code: string;
        turn?: number;
        event?: any;
        player?: any;
      };
    } = {
      paginate: { pageSize: 10000 },
      order: 'asc',
      conditions: {
        dealer_code: code,
        event: { $in: event },
        turn,
      },
    };

    // ゲームログを取得
    const activities = await activityService.list(condition);

    // 対戦開始のゲームログを取得
    const turnStartLog = await activityService.detailByCondition({
      dealer_code: code,
      event: SocketConst.EMIT.FIRST_PLAYER,
      turn,
    });

    // 対戦終了のゲームログを取得
    const turnEndLog = await activityService.detailByCondition({
      dealer_code: code,
      event: SocketConst.EMIT.FINISH_TURN,
      turn,
    });

    // 試合終了のゲームログを取得
    const gameEndLog = await activityService.detailByCondition({
      dealer_code: code,
      event: SocketConst.EMIT.FINISH_GAME,
    });

    return {
      activities,
      turnStartLog,
      turnEndLog,
      gameEndLog,
      allPlayers,
      game,
      condition,
    };
  }

  /**
   * ゲームログのDL
   * @param {string} code ディーラーコード
   * @returns {Promise<string>}
   */
  public async logDownload(code: string): Promise<string> {
    // ディーラーを取得
    const game = await dealerService.detailByCondition({ code });
    if (!game) {
      throw new BaseError({ message: AppConst.DEALER_NOT_FOUND });
    }

    const game_name = sanitize(game.name, { replacement: '_' }).replace(/\s/g, '_');
    const fileName = `${__dirname}/../../../logs/${game_name}-${game.code}.log`;
    if (!fs.existsSync(fileName)) {
      throw new BaseError({ message: AppConst.NOT_FOUND_FILE });
    }

    return fileName;
  }
}
