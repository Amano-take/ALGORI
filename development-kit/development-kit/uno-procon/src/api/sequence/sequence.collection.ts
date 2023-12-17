/**
 * Sequence collection
 * シーケンスのスキーマ定義
 */
import * as mongoose from 'mongoose';

import { SequenceModel } from './sequence.model';
import { AppKey } from '../../commons/consts/app.key';
import { AppObject } from '../../commons/consts/app.object';

const Schema = mongoose.Schema;

const SequenceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  AppObject.SCHEMA_OPTIONS,
);

export const Sequences: mongoose.Model<SequenceModel> = mongoose.model(
  AppKey.SEQUENCE,
  SequenceSchema,
);
