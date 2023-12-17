/**
 * @description request model
 * @version 1.0.0
 */

import { ServiceOption } from './common.model';

export interface OptionRequest {
  /**
   * @field service
   * @type string
   * @enum reference service option
   */
  service: ServiceOption;
  /**
   * @field url
   * @type string
   * @description url integrate
   * @example api/v1/common/account
   */
  url: string;
  /**
   * @field urlOverride
   * @type boolean
   * @description if value is true <=> override url, false <=> appending prefix config
   * @example https://api-dev.sotatek.group/api/v1/common/account
   */
  urlOverride?: boolean;
  /**
   * @field urlOverride
   * @type Object
   * @description object body
   * @example {name: 'John nathan', address: 'New York'}
   */
  body?: any;
  /**
   * @field qs
   * @type Object
   * @description query string
   * @example {page_size: 20, brand: '2018,2019' }
   */
  qs?: any;
  /**
   * @field secure
   * @todo
   */
  secure?: boolean; // default true
}

export enum MethodOption {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}
