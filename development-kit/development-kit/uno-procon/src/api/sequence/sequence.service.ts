/**
 * Sequence serivice
 * シーケンスの操作を行うサービスクラス
 */
import { SequenceModel } from './sequence.model';
import { SequenceRepository } from './sequence.repository';

const sequenceRepository = new SequenceRepository();

export class SequenceService {
  /**
   * 指定した条件に該当するドキュメントを取得
   * @param {any} conditions
   * @returns {Promise}
   */
  public async detailByCondition(conditions: any): Promise<SequenceModel> {
    return sequenceRepository.detailByCondition(conditions);
  }

  /**
   * 指定した条件に該当するドキュメントを1件更新
   * @param {any} conditions
   * @returns {Promise}
   */
  public async findOneAndUpdate(conditions: any): Promise<SequenceModel> {
    return sequenceRepository.findOneAndUpdate(conditions);
  }

  /**
   * 新規シーケンス追加
   * @param {string} params.name シーケンス名
   * @param {number} params.counter カウンター初期値
   * @returns {Promise}
   */
  public async create(params: { name: string; counter: number }): Promise<any> {
    return sequenceRepository.create(params);
  }

  /**
   * 指定したIDに該当するシーケンスを削除
   * @param conditions
   * @returns {Promise}
   */
  public async deleteById(id: string): Promise<any> {
    return sequenceRepository.deleteOne({ id });
  }
}
