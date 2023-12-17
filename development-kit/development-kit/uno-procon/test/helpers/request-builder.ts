/**
 * @description config request builder
 * @since 2018-06-20
 */

import * as fs from 'fs';
import * as chai from 'chai';
import * as supertest from 'supertest'; // test api <=> (module <=> chai-http)
import * as jsonSchema from 'chai-json-schema';
import * as shallowDeepEqual from 'chai-shallow-deep-equal';

import CONSTS from './consts';
import * as utils from './utils';
import server from '../../src/app';
import StaticValues from './static-values';

type MultipartValueSingle = Blob | Buffer | fs.ReadStream | string | boolean | number;
type QueryParams = string | { [field: string]: number | string | boolean };

chai.use(shallowDeepEqual);
chai.use(jsonSchema);

export class RequestBuilder {
  private readonly apiUri: string;
  private request: supertest.SuperTest<supertest.Test>;

  constructor(prefixRoute?: string) {
    this.apiUri = utils.normalizePath(`/api/v1/${prefixRoute}`);
    this.request = supertest(server);
  }

  get(path: string, queryParams?: QueryParams): IRequest {
    return new Request(
      this.request.get(
        utils.normalizePath(this.apiUri + path) + utils.stringifyQueryParams(queryParams),
      ),
    );
  }

  post(path: string, queryParams?: QueryParams, data?: any): IRequest {
    return new Request(
      this.request
        .post(utils.normalizePath(this.apiUri + path) + utils.stringifyQueryParams(queryParams))
        .send(data),
    );
  }

  put(path: string, queryParams?: QueryParams, data?: any): IRequest {
    return new Request(
      this.request
        .put(utils.normalizePath(this.apiUri + path) + utils.stringifyQueryParams(queryParams))
        .send(data),
    );
  }

  patch(path: string, queryParams?: QueryParams, data?: any): IRequest {
    return new Request(
      this.request
        .patch(utils.normalizePath(this.apiUri + path) + utils.stringifyQueryParams(queryParams))
        .send(data),
    );
  }

  delete(path: string, queryParams?: QueryParams) {
    return new Request(
      this.request.del(
        utils.normalizePath(this.apiUri + path) + utils.stringifyQueryParams(queryParams),
      ),
    );
  }
}

class Response implements IResponse {
  private response: supertest.Test;

  constructor(_res: supertest.Test) {
    this.response = _res;
    this.response.expect('content-type', /json/);
  }

  expect(schema: any, target?: any): this {
    const args = arguments.length;
    switch (typeof schema) {
      case 'number':
        this.response.expect(schema);
        break;
      case 'string':
        if ('string' === typeof target || target instanceof RegExp) {
          this.response.expect(<string>schema, <string>target);
        }
        break;
      case 'object': {
        let testSchema = false;
        let testData = false;
        if (args == 1) {
          testData = true;
          target = schema;
        }
        if (args == 2) {
          testSchema = true;
          if (target === undefined) testData = false;
        }
        this.response.expect((res: supertest.Response) => {
          if (testSchema) chai.expect(res.body).to.be.jsonSchema(schema);
          if (testData) {
            chai.expect(res.body).to.be.shallowDeepEqual(target);
          }
        });
        break;
      }
      default:
        break;
    }
    return this;
  }

  expectStatus(status: number): this {
    this.response.expect(status);
    return this;
  }

  expectHeader(field: string, val: string | RegExp): this {
    this.response.expect(field, <RegExp>val);
    return this;
  }

  expectSchema(schema: object): this {
    this.response.expect((res: supertest.Response) => {
      chai.expect(res.body).to.be.jsonSchema(schema);
    });
    return this;
  }

  expectBody(data: any): this {
    this.response.expect((res: supertest.Response) => {
      chai.expect(res.body).to.be.shallowDeepEqual(data);
    });
    return this;
  }

  /**
   * @method setValue
   * @description set alias value
   * @return {this}
   * @param fields - [{alias_key: 'main_key_in_response'}]
   */
  setValue(fields: { [key: string]: string }[]): this {
    this.response.expect((res: supertest.Response) => {
      const objectPush = fields.reduce(
        (sum: any, field: any) =>
          (Object as any).assign(sum, {
            [Object.keys(field)[0]]: res.body.data[field[Object.keys(field)[0]]],
          }),
        {},
      );
      StaticValues.GLOBAL = (Object as any).assign(StaticValues.GLOBAL, objectPush);
    });
    return this;
  }

  timeout(ms: number): this {
    if (ms === -1) this.response.clearTimeout();
    else this.response.timeout(ms);
    return this;
  }

  end(callback: supertest.CallbackHandler) {
    this.response.end(callback);
  }
}

class Request extends Response implements IRequest {
  private request: supertest.Test;

  constructor(_req: supertest.Test) {
    super(_req);
    this.request = _req;
    this.request.set('Content-Type', 'application/json');
    this.request.timeout(CONSTS.REQUEST_TIMEOUT);
  }

  set(field: string | object, val?: string): this {
    this.request.set(<any>field, val);
    return this;
  }

  attach(
    field: string,
    file: any,
    options?: string | { filename?: string; contentType?: string },
  ): this {
    this.request.attach(field, file, options);
    return this;
  }

  send(data: object): this {
    this.request.send(data);
    return this;
  }

  query(data: object): this {
    this.request.query(data);
    return this;
  }
}

interface IResponse {
  expect(status: number): IResponse;

  expect(schema: object, responseData: any): IResponse;

  expect(responseData: any): IResponse;

  expect(field: string, val: string | RegExp): IResponse;

  expectStatus(status: number, assertDefault?: boolean): IResponse;

  expectHeader(field: string, val: string | RegExp): IResponse;

  expectSchema(schema: object): IResponse;

  expectBody(data: any): IResponse;

  setValue(data: any): IResponse;

  end(callback: supertest.CallbackHandler): void;

  timeout(ms: number): this;
}

interface IRequest extends IResponse {
  set(field: string | object, val?: string): this;

  attach(
    field: string,
    file: MultipartValueSingle,
    options?: string | { filename?: string; contentType?: string },
  ): this;

  send(data: object): this;

  query(data: object): this;
}
