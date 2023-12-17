/**
 * Dealer model
 * ディーラーのモデル定義
 */
import { Document } from 'mongoose';

import { ParamCommonList } from '../../libs/commons';

export type DealerModel = Document & {
  code: string; // ディーラーコード
  name: string; // ディーラー名
  players: string[]; // プレイヤーコードリスト
  status: string; // ゲームステータス
  order?: {
    [key: string]: number; // 勝数
  };
  score?: {
    [key: string]: number; // 点数
  };
  winner?: string; // 勝者
  turn?: number; // 対戦数
  totalTurn: number; // 総対戦数
  whiteWild: string; // 白いワイルド効果
};

export type ParamDealerList = ParamCommonList;
