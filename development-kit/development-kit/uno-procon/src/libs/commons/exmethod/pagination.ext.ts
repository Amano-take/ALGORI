/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * @description pagination extension
 * @ref https://github.com/enkidevs/mongoose-cursor-pagination/blob/master/src/index.js
 */

import * as async from 'async';
import * as Promise from 'bluebird';
import * as mongoose from 'mongoose';
import { merge, omitBy, isNil } from 'lodash';

import { ConstLib } from '../consts';
import { PaginateCursorParams, PaginateParams, Pagination } from '../models';

const btoa = require('btoa');
const atob = require('atob');

/**
 * @method paginate
 * @param {PaginateParams} params
 * @param {(err: any, data: PaginationNew<Document[]>) => void} callback
 * @return {Bluebird<Pagination<Document[]>>}
 * @example
 {
      sort: _id:1;name:1;address:-1,
      page: number,
      pageSize: number,
      select: name:0;email:1,
      populations: account:name address,
      where: role:wholesaler;status.active.is_active:1,
      pattern: email:manhhipkhmt2;
      content: 'mr.nguyen'
   }
 */
mongoose.Query.prototype.paginate = function (
  params: PaginateParams = {},
  callback?: (err: any, data: Pagination<Document[]>) => void,
): Promise<Pagination<Document[]>> {
  params = !params ? {} : params;
  return new Promise<Pagination<Document[]>>((resolve, reject) => {
    if (!params) {
      params = {} as PaginateParams;
    }
    params.page = +params.page || 1;
    params.pageSize = +params.pageSize || ConstLib.PAGE_SIZE;

    let queryDocs: mongoose.Query<any> = this as any;

    //#region where & pattern
    const _where: any = {};
    if (params.where) {
      const whereValues: string[] = params.where.split(';');
      whereValues.forEach((wv: string) => {
        const value: string[] = wv.split(':');
        _where[value[0]] = Number(value[1]) + 1 ? Number(value[1]) : value[1] || undefined;
      });
    }
    if (params.pattern) {
      const patternValues: string[] = params.pattern.split(';');
      patternValues.forEach((pv: string) => {
        const value: string[] = pv.split(':');
        _where[value[0]] = new RegExp(value[1], 'i') || undefined;
      });
    }
    // security => priority query condition from _condition > _where
    const endConditionWhereOrPattern = omitBy(merge(_where, this._conditions), isNil);
    queryDocs.find(endConditionWhereOrPattern);
    //#endregion

    // full text search
    if (params.content) {
      const searchValue: string = params.content;
      const condition = {
        $text: {
          $search: searchValue,
        },
      };
      queryDocs.find(condition);
    }

    // verify query sort - value is [1] or [-1] -----------------------------------------
    if (params.sort) {
      const sort: any = {};
      const sortValues: string[] = params.sort.split(';');
      sortValues.forEach((sv: string) => {
        const value: string[] = sv.split(':');
        sort[value[0]] = +(value[1] || 1);
      });
      queryDocs.sort(sort);
    }

    // verify query select - value is [0] or [1] ---------------------------------------
    if (params.select) {
      const select: any = {};
      const selectValues: string[] = params.select.split(';');
      selectValues.forEach((sv: string) => {
        const value: string[] = sv.split(':');
        select[value[0]] = +(value[1] || 1);
      });
      queryDocs.select(select);
    }

    // verify pageSize
    if (params.pageSize !== -1) {
      queryDocs = queryDocs.skip((params.page - 1) * params.pageSize).limit(params.pageSize);
    }

    // population ----------------------------------------------------------------------
    if (params.populations) {
      const populate: any[] = [];
      const pops: string[] = params.populations.split(';');
      pops.forEach((popEle: string) => {
        const value: string[] = popEle.split(':');
        populate.push({
          path: value[0],
          select: value[1],
        });
      });
      queryDocs.populate(populate);
    }
    const queryCount = (this as any).model.countDocuments(
      (this as any)._conditions || params.where,
    );
    async.parallel(
      {
        data: (cb: Function) => queryDocs.exec(cb),
        totalItem: (cb: Function) => queryCount.exec(cb),
      },
      (err: any, data: any) => {
        if (err) return reject(err);
        let result: Pagination<Document[]>;
        if (!err && data) {
          result = <Pagination<Document[]>>data;
          result.page = params.page;
          result.pageSize = params.pageSize === -1 ? result.data.length : params.pageSize;
          result.totalPage = Math.ceil(result.totalItem / (result.pageSize || 1));
        }
        resolve(result);
      },
    );
  }).nodeify(callback);
};

/**
 * @method paginate
 * @param {PaginateParams} params
 * @param {(err: any, data: PaginationNew<Document[]>) => void} callback
 * @return {Bluebird<Pagination<Document[]>>}
 * @example
 {
      sort: _id:1
      pageSize: number,
      select: name:0;email:1,
      populations: account:name address,
      where: role:wholesaler;status.active.is_active:1,
      next: 'NWQxNDZjOTlmYTY5MDkwMDEyODE1ZDVi'
   }
 */
mongoose.Query.prototype.paginateCursor = function (
  params: PaginateCursorParams = {},
  callback?: (err: any, data: Pagination<Document[]>) => void,
): Promise<Pagination<Document[]>> {
  params = !params ? {} : params;
  return new Promise<Pagination<Document[]>>((resolve, reject) => {
    // set default sort
    let keyPrimary = '_id';

    if (!params) {
      params = {} as PaginateCursorParams;
    }
    const page = 1;
    params.pageSize = +params.pageSize || ConstLib.PAGE_SIZE;

    let queryDocs: mongoose.Query<any> = this as any;

    // verify query where [normal] + [pattern]
    const _where: any = {};
    if (params.where) {
      const whereValues: string[] = params.where.split(';');
      whereValues.forEach((wv: string) => {
        const value: string[] = wv.split(':');
        _where[value[0]] = value[1] || undefined;
      });
    }
    if (params.pattern) {
      const patternValues: string[] = params.pattern.split(';');
      patternValues.forEach((pv: string) => {
        const value: string[] = pv.split(':');
        _where[value[0]] = new RegExp(value[1]) || undefined;
      });
    }

    // verify query sort - value is [1] or [-1] -----------------------------------------
    let sort: any = { [keyPrimary]: -1 };
    if (params.sort) {
      const value: string[] = params.sort.split(';')[0].split(':');
      keyPrimary = value[0];
      sort = { [keyPrimary]: +(value[1] || 1) };
    }

    // finish where
    let reverse = false;
    if (params.next || params.previous) {
      _where[keyPrimary] = {};
      if (params.next) {
        _where[keyPrimary] = { [sort[keyPrimary] <= 0 ? '$lt' : '$gt']: atob(params.next) };
      } else {
        _where[keyPrimary] = { [sort[keyPrimary] <= 0 ? '$gt' : '$lt']: atob(params.previous) };
        sort[keyPrimary] = sort[keyPrimary] <= 0 ? 1 : -1;
        reverse = true;
      }
    }

    // security => priority query condition from _condition > _where
    const endConditionWhereOrPattern = omitBy(merge(_where, this._conditions), isNil);
    queryDocs.find(endConditionWhereOrPattern);
    queryDocs.sort(sort);

    // verify query select - value is [0] or [1] ---------------------------------------
    if (params.select) {
      const select: any = {};
      const selectValues: string[] = params.select.split(';');
      selectValues.forEach((sv: string) => {
        const value: string[] = sv.split(':');
        select[value[0]] = +(value[1] || 1);
      });
      queryDocs.select(select);
    }

    // verify pageSize
    if (params.pageSize !== -1) {
      queryDocs = queryDocs.skip((page - 1) * params.pageSize).limit(params.pageSize);
    }
    if (params.populations) {
      const populate: any[] = [];
      const pops: string[] = params.populations.split(';');
      pops.forEach((popEle: string) => {
        const value: string[] = popEle.split(':');
        populate.push({
          path: value[0],
          select: value[1],
        });
      });
      queryDocs.populate(populate);
    }
    const queryCount = (this as any).model.countDocuments(
      (this as any)._conditions || params.where,
    );
    async.parallel(
      {
        data: (cb: Function) => queryDocs.exec(cb),
        totalItem: (cb: Function) => queryCount.exec(cb),
      },
      (err: any, data: any) => {
        if (err) return reject(err);
        let result: Pagination<Document[]>;
        if (!err && data) {
          result = <Pagination<Document[]>>data;
          result.page = 1;
          result.pageSize = params.pageSize === -1 ? result.data.length : params.pageSize;
          result.totalPage = Math.ceil(result.totalItem / (result.pageSize || 1));
          if (result.data.length > 0) {
            if (reverse) {
              result.data = result.data.reverse();
            }
            result.hashNext = result.totalPage > result.page || (!params.next && !!params.previous);
            if (result.hashNext) {
              result.next = btoa((result.data[result.data.length - 1] as any)._id);
            }
            // result.hashPrevious = !params.next && !!params.previous;
            result.hashPrevious =
              !!params.next || (result.totalPage > result.page && !!params.previous);
            if (result.hashPrevious) {
              result.previous = btoa((result.data[0] as any)._id);
            }
          }
        }
        resolve(result);
      },
    );
  }).nodeify(callback);
};

export default 'mongoose/Query';
