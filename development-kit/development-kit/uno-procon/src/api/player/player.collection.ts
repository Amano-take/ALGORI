/**
 * Player collection
 * プレイヤーのスキーマ定義
 */

import * as mongoose from 'mongoose';

import { PlayerModel } from './player.model';
import { AppKey } from '../../commons/consts/app.key';
import { AppObject } from '../../commons/consts/app.object';

const Schema = mongoose.Schema;

const PlayerSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    team: {
      type: String,
    },
    score: {
      type: Schema.Types.Mixed,
      required: false,
    },
    total_score: {
      type: Number,
      required: false,
    },
  },
  AppObject.SCHEMA_OPTIONS,
);

export const Players: mongoose.Model<PlayerModel> = mongoose.model(AppKey.PLAYER, PlayerSchema);
