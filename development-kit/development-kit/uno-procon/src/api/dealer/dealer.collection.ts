/**
 * Dealer collection
 * ディーラーのスキーマ定義
 */
import * as mongoose from 'mongoose';

import { DealerModel } from './dealer.model';
import { AppKey } from '../../commons/consts/app.key';
import { AppObject } from '../../commons/consts/app.object';

const Schema = mongoose.Schema;

const DealerSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    players: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      required: true,
    },
    order: {
      type: Schema.Types.Mixed,
      required: false,
    },
    score: {
      type: Schema.Types.Mixed,
      required: false,
    },
    turn: {
      type: Number,
      required: false,
    },
    totalTurn: {
      type: Number,
      required: true,
    },
    winner: {
      type: String,
      required: false,
    },
    whiteWild: {
      type: String,
      required: false,
    },
    restrictInterrupt: {
      type: Boolean,
      required: false,
    },
  },
  AppObject.SCHEMA_OPTIONS,
);

export const Dealers: mongoose.Model<DealerModel> = mongoose.model(AppKey.DEALER, DealerSchema);
