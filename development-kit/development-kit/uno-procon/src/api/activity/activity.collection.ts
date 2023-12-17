/**
 * Activity collection
 * ゲームログのスキーマ定義
 */
import * as mongoose from 'mongoose';

import { ActivityModel } from './activity.model';
import { AppKey } from '../../commons/consts/app.key';
import { AppObject } from '../../commons/consts/app.object';

const Schema = mongoose.Schema;

const ActivitySchema = new Schema(
  {
    dealer_code: {
      type: String,
      required: false,
    },
    dealer: {
      type: String,
      required: false,
    },
    player: {
      type: String,
      required: false,
    },
    event: {
      type: String,
      required: false,
    },
    turn: {
      type: Number,
      required: false,
    },
    contents: {
      type: Schema.Types.Mixed,
      required: false,
    },
    desk: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  AppObject.SCHEMA_OPTIONS,
);

ActivitySchema.index({ dealer: 1, event: 1 });

export const Activities: mongoose.Model<ActivityModel> = mongoose.model(
  AppKey.ACTIVITY,
  ActivitySchema,
);
