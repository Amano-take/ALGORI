/**
 * Dealer serivice
 * ディーラーの操作を行うサービスクラス
 */
import { DealerRepository } from './dealer.repository';
import { DealerModel, ParamDealerList } from './dealer.model';
import { SequenceService } from '../sequence/sequence.service';
import { AppConst } from '../../commons/consts/app.const';
import { Desk, StatusGame, WhiteWild } from '../../commons/consts/app.enum';
import { AppObject } from '../../commons/consts/app.object';
import { CommonService } from '../../commons/common.service';
import { ParamCommonUpdateOne, Utils, getLogger } from '../../libs/commons';
import redisClient from '../../configs/database/redis.config';
import { BaseError } from '../../libs/standard';

const dealerRepository = new DealerRepository();
const sequenceService = new SequenceService();
const util = new Utils();

export class DealerService {
  /**
   * レコードの新規作成
   * @param {string} params.name
   * @param {number} params.totalTrun
   * @param {WhiteWild} params.whiteWild
   * @returns {Promise}
   */
  public async create(params: {
    name: string;
    totalTurn: number;
    whiteWild: WhiteWild;
  }): Promise<any> {
    const startingDealer = await this.list({
      conditions: {
        name: params.name,
        status: StatusGame.STARTING,
      },
    });

    for (let i = 0; i < startingDealer.data.length; i++) {
      if (startingDealer.data[i].status === StatusGame.STARTING) {
        throw new BaseError({ message: AppConst.DEALER_IS_CURRENTLY_IN_MATCH });
      }
    }

    await this.update({
      conditions: { name: params.name },
      data: { status: StatusGame.FINISH },
    });

    const sequence = await sequenceService.findOneAndUpdate({
      conditions: { name: 'dealer' },
      data: {
        $inc: { counter: 1 },
      },
    });

    const data = {
      ...params,
      code: `D-${util.zeroPadding(sequence.counter, AppConst.CODE_LENGTH)}`,
    };

    getLogger('admin', '').info(`Create game. ${JSON.stringify(data)}`);
    return dealerRepository.create(data);
  }

  /**
   * 条件に該当するレコードを全件更新する
   * @param {ParamCommonUpdateOne} params
   * @returns {Promise}
   */
  public async update(params: ParamCommonUpdateOne): Promise<any> {
    return dealerRepository.updateMany(params);
  }

  /**
   * 条件に該当するレコードを1件更新する
   * @param {ParamCommonUpdateOne} params
   * @returns {Promise}
   */
  public async updateByCondition(params: ParamCommonUpdateOne): Promise<any> {
    return dealerRepository.updateOne(params);
  }

  /**
   * 指定したIDに該当するレコードを1件取得する
   * @param {string} id
   * @returns {Promise}
   */
  public async detailById(id: string): Promise<DealerModel> {
    const dealer = await dealerRepository.detailById(id);
    if (!dealer) {
      throw new BaseError({ message: AppConst.DEALER_NOT_FOUND });
    }

    return dealer;
  }

  /**
   * 条件に該当するレコードを1件取得する
   * @param {any} conditions
   * @returns {Promise}
   */
  public async detailByCondition(conditions: any): Promise<DealerModel> {
    return dealerRepository.detailByCondition(conditions);
  }

  /**
   * 条件に該当するレコードを全件取得する
   * @param {ParamDealerList} params
   * @returns {Promise}
   */
  public async list(params: ParamDealerList): Promise<any> {
    return dealerRepository.list(params);
  }

  /**
   * 指定したIDのレコードを削除する
   * @param {string} id
   * @returns {Promise}
   */
  public async deleteById(id: string): Promise<DealerModel> {
    await this.detailById(id);
    return dealerRepository.deleteOne({ id });
  }

  /**
   * 指定したディーラーコードの試合を開始する
   * @param {string} code // ディーラーコード
   * @returns {Promise} ゲーム情報
   */
  public async startDealer(code: string): Promise<Desk> {
    const dealer = await this.detailByCondition({ code });
    if ((dealer.status as StatusGame) !== StatusGame.NEW) {
      throw new BaseError({ message: AppConst.STATUS_DEALER_INVALID_CAN_NOT_START_DEALER });
    }

    const deskInfo: Desk = JSON.parse(
      await redisClient.get(`${AppObject.REDIS_PREFIX.DESK}:${dealer.code}`),
    );
    let isFirstStart = true;
    if (deskInfo) {
      if (deskInfo.turn > 1) {
        isFirstStart = false;
      }
    }

    getLogger('dealer', dealer.code).info(`Start game. ${dealer.code}`);
    return await CommonService.startDealer(dealer.code, dealer, isFirstStart);
  }
}
