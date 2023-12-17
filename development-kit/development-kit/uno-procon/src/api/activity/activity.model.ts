/**
 * Activity model
 * ゲームログのモデル定義
 */
import { Document } from 'mongoose';

import { ParamCommonList } from '../../libs/commons';
import { Card } from '../../commons/consts/app.enum';

export type ActivityModel = Document & {
  dealer_code: string; // ディーラーコード
  dealer: string; // ディーラー名
  player: string; // プレイヤーコード
  event: string; // 行動タイプ
  turn?: number; // 対戦数
  contents: any; // ログ詳細
  desk: {
    before_card_play: Card; // 場札のカード
    card_of_player: {
      [key: string]: Card[]; // 手札
    };
    yell_uno: {
      [key: string]: boolean; // UNO宣言状態
    };
  };
};

export type ParamActivityList = ParamCommonList;
