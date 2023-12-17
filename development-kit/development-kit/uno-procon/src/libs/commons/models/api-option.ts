import { Environment } from './common.model';

export interface ApiOption {
  /**
   * @field allowAnonymous
   * @description allow connect api not secure
   */
  allowAnonymous?: boolean;

  /**
   * @field skipVerifySession
   * @description skip verify session
   */
  skipVerifySession?: boolean;

  /**
   * @field clientVerify
   * @description client id verify
   */
  clientVerify?: boolean;

  /**
   * @field secretVerify
   * @description secret key verify is access internal service
   */
  secretVerify?: boolean;

  /**
   * @field roles
   * @description config roles access api
   */
  roles?: string | string[];

  /**
   * @field preventRoles
   * @description config role specified prevent
   */
  preventRoles?: string | string[];

  /**
   * @field env
   * @description apply api execute for environment
   */
  env?: Environment[];
}
