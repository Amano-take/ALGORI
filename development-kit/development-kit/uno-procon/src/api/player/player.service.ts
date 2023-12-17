/**
 * Dealer serivice
 * プレイヤーの操作を行うサービスクラス
 */
import { exec } from 'child_process';

import { PlayerRepository } from './player.repository';
import { ParamPlayerList, PlayerModel } from './player.model';
import { DealerService } from '../dealer/dealer.service';
import { SequenceService } from '../../api/sequence/sequence.service';
import { AppConst } from '../../commons/consts/app.const';
import { Utils, getLogger } from '../../libs/commons';
import { BaseError } from '../../libs/standard';

const playerRepository = new PlayerRepository();
const dealerService = new DealerService();
const sequenceService = new SequenceService();
const util = new Utils();

export class PlayerService {
  /**
   * 指定したIDに該当するプレイヤー取得
   * @param {string} id プレイヤーID
   * @returns {Promise}
   */
  public async detailById(id: string): Promise<PlayerModel> {
    return playerRepository.detailById(id);
  }

  /**
   * 指定した条件に該当するプレイヤーを1件取得
   * @param {any} conditions 検索条件
   * @returns {Promise}
   */
  public async detailByCondition(conditions: any): Promise<PlayerModel> {
    return playerRepository.detailByCondition(conditions);
  }

  /**
   * 指定した条件に該当するプレイヤー一覧を取得
   * @param {any} params 検索条件
   * @returns {Promise}
   */
  public async list(params: ParamPlayerList): Promise<any> {
    return playerRepository.list(params);
  }

  /**
   * プレイヤーの新規追加
   * @param {string} params.name プレイヤー名
   * @returns {Promise}
   */
  public async create(params: { name: string }): Promise<any> {
    const sequence = await sequenceService.findOneAndUpdate({
      conditions: { name: 'player' },
      data: {
        $inc: { counter: 1 },
      },
    });
    const data = {
      ...params,
      code: `P-${util.zeroPadding(sequence.counter, AppConst.CODE_LENGTH)}`,
    };
    return playerRepository.create(data);
  }

  /**
   * 指定したIDに該当するプレイヤーを削除
   * @param {string} id プレイヤーID
   * @returns {Promise}
   */
  public async deleteById(id: string): Promise<any> {
    return playerRepository.deleteOne({ id });
  }

  /**
   * 試合に補助プレイヤーを参加させる
   * @param {string} code プレイヤーID
   * @returns {Promise}
   */
  public async addPlayer(code: string): Promise<any> {
    const dealer = await dealerService.detailByCondition({ code });
    const players = dealer.players;
    if (players.length >= AppConst.MAX_PLAYER) {
      throw new BaseError({ message: AppConst.FULL_PLAYER });
    }

    const fileName = `${__dirname}/../../commons/alternative-player.ts`;
    const host = 'http://localhost:8080';
    const player = `Alternative ${players.length + 1}`;
    exec(`ts-node ${fileName} "${host}" "${dealer.name}" "${player}"`, (err, _, stderr) => {
      if (err) {
        getLogger('admin', '').error(`${err}`);
        throw err;
      }

      if (stderr) {
        getLogger('admin', '').warn(stderr);
      }
    });

    return player;
  }
}
