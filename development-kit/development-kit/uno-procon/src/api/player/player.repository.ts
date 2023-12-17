/**
 * Player repository
 * プレイヤーのリポジトリ定義
 */

import { PlayerModel } from './player.model';
import { Players } from './player.collection';
import { MongooseRepository } from '../../libs/standard';

export class PlayerRepository extends MongooseRepository<PlayerModel> {
  constructor() {
    super(Players);
  }
}
