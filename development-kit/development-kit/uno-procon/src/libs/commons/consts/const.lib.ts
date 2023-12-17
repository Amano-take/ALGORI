/**
 * @module const library
 * @description define all const in library
 */

export class ConstLib {
  //#region Const by Config
  static readonly SYSTEM_IDENTIFY: string = 'SOTATEK';
  static readonly DEFAULT: any = {
    SYSTEM_IDENTIFY: 'SOTATEK',
    COUNTRY_CODE: 'us',
  };
  static readonly JWT_SECRET_ALGORITHM: string = 'HS512';
  static readonly DEVICE_MOBILE: string = 'mobile';
  static readonly STAGE: {
    ACTIVED: string;
    DEACTIVED: string;
    DELISTED: string;
  } = {
    ACTIVED: 'actived',
    DEACTIVED: 'deactived',
    DELISTED: 'delisted',
  };
  static readonly BOOLEAN: any = {
    TRUE: 'true',
    FALSE: 'false',
  };
  static readonly COMMON_UNDEFINED: string = 'Undefined';

  /**
   * @field PAGE_SIZE
   * @description default page size
   */
  static readonly PAGE_SIZE: number = 20;

  /**
   * @field PAGE_CURSOR
   * @description page cursor field support
   * @link https://github.com/mixmaxhq/mongo-cursor-pagination#find
   */
  static readonly PAGE_CURSOR: string[] = [
    // 'query',
    'limit',
    'fields',
    'paginatedField',
    'sortAscending',
    'next',
    'previous',
  ];

  /**
   * @field TEMPLATES
   * @description mail template key
   * @type {string[]}
   */
  static readonly TEMPLATES = {
    REGISTER: {
      KEY: 'register',
      SUBJECT: 'Welcome to Sotatek dev team.',
    },
  };

  static readonly TEMPLATE_KEY: string[] = Object.values(ConstLib.TEMPLATES).map(
    (item: any) => item.KEY,
  );
  //#endregion

  //#region Code or Message
  static readonly ADDRESS_CITY_INVALID: string = 'Address city invalid.';
  static readonly ADDRESS_INFO_INVALID: string = 'Address info invalid.';
  static readonly ENVIRONMENT_NOT_SUPPORT: string = 'Environment not support';
  static readonly ADDRESS_ZIP_CODE_INVALID: string = 'Address zip code invalid.';
  static readonly ADDRESS_STATE_CODE_INVALID: string = 'Address state code invalid.';
  static readonly MISSING_CONFIG_GOOGLE_TOKEN: string = 'Missing config google token.';
  static readonly LOGGER_GRAY_HTTP_WARNING =
    '[LOGGER] type "gray-http" is disable. Not recommended. In this state, errors and exceptions will ' +
    'not be sent to the Log center. This is potentially risky and difficult to evaluate errors for the development team. ' +
    'Should turn on in most cases';
  //#endregion

  //#region Const for Error
  static readonly ERRORS_SERVER_TYPE: string[] = [
    'EvalError',
    'InternalError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'TypeError',
    'URIError',
  ];
  static readonly ERROR_STATUS_CODE_INVALID: string = 'Status code is not valid';
  static readonly ERROR_SESSION_EXPIRE: string = 'Session expire.';
  static readonly ERROR_MESSAGE_DEFAULT_SYSTEM: string =
    'An error has arisen from the system. Please try again later or contact us for a fix.';
  //#endregion
}
