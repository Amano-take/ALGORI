/**
 * Player model
 * プレイヤーのモデル定義
 */
import { Document } from 'mongoose';

import { ParamCommonList } from '../../libs/commons';

export type PlayerModel = Document & {
  code: string; // プレイヤーコード
  name: string; // プレイヤー名
  team: string; // チーム名
  score?: {
    [key: string]: number[]; // 試合ごとの得点数リスト
  };
  total_score?: number; // 総得点
};

export type ParamPlayerList = ParamCommonList;
