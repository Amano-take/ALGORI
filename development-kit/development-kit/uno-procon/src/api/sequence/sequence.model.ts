/**
 * Sequence model
 * シーケンスのモデル定義
 */
import { Document } from 'mongoose';

import { ParamCommonList } from '../../libs/commons';

export type SequenceModel = Document & {
  name: string; // シーケンス名
  counter: number; // カウンター
};

export type ParamSequenceList = ParamCommonList;
