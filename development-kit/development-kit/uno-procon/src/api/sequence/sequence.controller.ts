/**
 * Sequence controller
 * シーケンスコントローラー
 */
import { SequenceService } from './sequence.service';
import { getLogger } from '../../libs/commons';

const sequenceService = new SequenceService();

export class SequenceController {
  /**
   * シーケンスコレクションの初期化
   */
  public async init() {
    getLogger('admin', '').info('Init sequenceService.');
    try {
      const dealerSequence = await sequenceService.detailByCondition({
        name: 'dealer',
      });
      if (!dealerSequence) {
        await sequenceService.create({
          name: 'dealer',
          counter: 0,
        });
        getLogger('admin', '').info('Create record of dealer sequnece.');
      }

      const playerSequence = await sequenceService.detailByCondition({
        name: 'player',
      });
      if (!playerSequence) {
        await sequenceService.create({
          name: 'player',
          counter: 0,
        });
        getLogger('admin', '').info('Create record of player sequnece.');
      }
    } catch (e) {
      getLogger('admin', '').error(e);
      throw e;
    }
  }
}
