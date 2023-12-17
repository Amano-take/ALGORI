/**
 * @description publish common mongoose repository
 * @version 1.0
 */

import * as mongoose from 'mongoose';
import {
  ParamCommonList,
  ParamCommonUpdateOne,
  ParamCommonUpdateMany,
  ParamCommonListCursor,
  ParamCommonFindOneAndUpdate,
  ParamCommonFindByIdAndUpdate,
  ParamCommonDetailByIdAndPopulate,
  ParamCommonDetailByConditionAndPopulate,
} from '../../../commons';

export class MongooseRepository<TModel extends mongoose.Document> {
  public TSchema: mongoose.Model<TModel>;

  constructor(_TSchema: mongoose.Model<TModel>) {
    this.TSchema = _TSchema;
  }

  async create(params: TModel) {
    return new this.TSchema(params).save();
  }

  async createMultiple(params: TModel[]) {
    return this.TSchema.insertMany(params);
  }

  async detailById(id: string, projections?: any) {
    return this.TSchema.findById(id, projections || {}).exec();
  }

  async detailByCondition(conditions: any, projections?: any) {
    return this.TSchema.findOne(conditions, projections || {}).exec();
  }

  async detailByIdAndPopulate(params: ParamCommonDetailByIdAndPopulate) {
    return this.TSchema.findById(params.id, params.projections || {})
      .populate(params.populate)
      .exec();
  }

  async detailByConditionAndPopulate(params: ParamCommonDetailByConditionAndPopulate) {
    return this.TSchema.findOne(params.conditions, params.projections || {})
      .populate(params.populate)
      .exec();
  }

  /**
   * @method list
   * @description get list data by condition support basic paging
   * @param params {ParamCommonList}
   */
  async list(params: ParamCommonList) {
    return this.TSchema.find(params.conditions || {}, params.projections || {})
      .sort({ dateCreated: params.order === 'desc' ? -1 : 1 })
      .paginate(params.paginate || {});
  }

  /**
   * @method listByCursorNew
   * @description get list data by condition support paging cursor
   * @param params {ParamCommonListCursor}
   */
  async listByCursor(params: ParamCommonListCursor) {
    return this.TSchema.find(params.conditions || {}, params.projections || {}).paginateCursor(
      params.paginateCursor || {},
    );
  }

  /**
   * @method listAllNew
   * @description get all data by condition (same listNew, but not support paging)
   * @param params {ParamCommonListCursor}
   */
  async listAll(params: ParamCommonList) {
    const schemas = await this.TSchema.find(
      params.conditions || {},
      params.projections || {},
    ).paginate(Object.assign(params.paginate || {}, { pageSize: -1 }));
    return schemas.data;
  }

  async findByIdAndUpdate(params: ParamCommonFindByIdAndUpdate) {
    return this.TSchema.findByIdAndUpdate(
      params.id,
      params.data,
      Object.assign(params.options || {}, { new: true }),
    ).exec();
  }

  async findOneAndUpdate(params: ParamCommonFindOneAndUpdate) {
    return this.TSchema.findOneAndUpdate(
      params.conditions,
      params.data,
      Object.assign(params.options || {}, { new: true }),
    ).exec();
  }

  async updateOne(params: ParamCommonUpdateOne) {
    return this.TSchema.updateOne(params.conditions, params.data, params.options || {}).exec();
  }

  async updateMany(params: ParamCommonUpdateMany) {
    return this.TSchema.updateMany(params.conditions, params.data, params.options || {}).exec();
  }

  async deleteOne(conditions: any) {
    return this.TSchema.deleteOne(conditions).exec();
  }

  async deleteMany(conditions: any) {
    return this.TSchema.deleteMany(conditions).exec();
  }

  async findByIdAndDelete(id: string) {
    return this.TSchema.findByIdAndDelete(id).exec();
  }

  async findOneAndDelete(conditions: any) {
    return this.TSchema.findOneAndDelete(conditions).exec();
  }

  async countByCondition(conditions: any) {
    return this.TSchema.countDocuments(conditions);
  }
}
