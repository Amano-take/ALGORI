/**
 * Dealer repository
 * ディーラーのリポジトリ定義
 */
import { DealerModel } from './dealer.model';
import { Dealers } from './dealer.collection';
import { MongooseRepository } from '../../libs/standard';

export class DealerRepository extends MongooseRepository<DealerModel> {
  constructor() {
    super(Dealers);
  }
}
