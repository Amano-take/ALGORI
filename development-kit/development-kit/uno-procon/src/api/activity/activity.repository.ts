/**
 * Activity collection
 * ゲームログのリポジトリ定義
 */
import { ActivityModel } from './activity.model';
import { Activities } from './activity.collection';
import { MongooseRepository } from '../../libs/standard';

export class ActivityRepository extends MongooseRepository<ActivityModel> {
  constructor() {
    super(Activities);
  }
}
