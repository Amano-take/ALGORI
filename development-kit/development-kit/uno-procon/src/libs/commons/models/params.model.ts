import { ModelUpdateOptions, QueryFindOneAndUpdateOptions } from 'mongoose';
import { PaginateCursorParams, PaginateParams } from './pagination';

export interface ParamCommonList {
  conditions: any;
  projections?: any;
  paginate?: PaginateParams;
  order?: 'asc' | 'desc';
}

export interface ParamCommonListCursor {
  conditions: any;
  projections?: any;
  paginateCursor?: PaginateCursorParams;
}

export interface ParamCommonDetailByIdAndPopulate {
  id: string;
  projections?: any;
  populate: any;
}

export interface ParamCommonDetailByConditionAndPopulate {
  conditions: any;
  projections?: any;
  populate: any;
}

export interface ParamCommonFindByIdAndUpdate {
  id: string;
  data: any;
  options?: QueryFindOneAndUpdateOptions;
}

export interface ParamCommonFindOneAndUpdate {
  conditions: any;
  data: any;
  options?: ModelUpdateOptions;
}

export interface ParamCommonUpdateOne {
  conditions: any;
  data: any;
  options?: ModelUpdateOptions;
}

export type ParamCommonUpdateMany = ParamCommonUpdateOne;
