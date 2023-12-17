/**
 * Activity serivice
 * ゲームログの操作を行うサービスクラス
 */
import { ActivityRepository } from './activity.repository';
import { ActivityModel, ParamActivityList } from './activity.model';
import { getLogger } from '../../libs/commons';

const activityRepository = new ActivityRepository();

export class ActivityService {
  /**
   * ゲームログの作成
   * @param {any} params ログ詳細
   * @param {boolean} log4Movie 映像ログ出力フラグ
   * @return {Promise}
   */
  public async create(params: ActivityModel, log4Movie: boolean = true): Promise<any> {
    if (log4Movie) {
      getLogger('movie', `${params.dealer}-${params.dealer_code}`).info({
        ...params,
        dateCreated: Date.now(),
      });
    }
    return activityRepository.create(params);
  }

  /**
   * IDで指定したゲームログを1件取得する
   * @param {string} id ログID
   * @return {Promise}
   */
  public async detailById(id: string): Promise<ActivityModel> {
    return activityRepository.detailById(id);
  }

  /**
   * 指定した条件に該当するゲームログを1件取得する
   * @param conditions
   * @return {Promise}
   */
  public async detailByCondition(conditions: any): Promise<ActivityModel> {
    return activityRepository.detailByCondition(conditions);
  }

  /**
   * 指定の条件に該当するゲームログの一覧を取得する
   * @param params
   * @return {Promise}
   */
  public async list(params: ParamActivityList): Promise<any> {
    return activityRepository.list(params);
  }

  /**
   * IDで指定したゲームログを削除する
   * @param id
   * @return {Promise}
   */
  public async deleteById(id: string): Promise<any> {
    return activityRepository.deleteOne({ id });
  }
}
