/**
 * Sequence model
 * シーケンスのモデル定義
 */
import { SequenceModel } from './sequence.model';
import { Sequences } from './sequence.collection';
import { MongooseRepository } from '../../libs/standard';

export class SequenceRepository extends MongooseRepository<SequenceModel> {
  constructor() {
    super(Sequences);
  }
}
