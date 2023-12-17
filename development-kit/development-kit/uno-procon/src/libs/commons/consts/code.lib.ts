/**
 * @description config app-code
 */

export class CodeLib {
  // CODE AUTHENTICATE
  static readonly AUTHENTICATE_JWT_EXPIRE: string = 'authenticate_jwt_expire';
  static readonly AUTHENTICATE_JWT_INVALID: string = 'authenticate_jwt_invalid';
  static readonly AUTHENTICATE_REVOKED_TOKEN: string = 'authenticate_revoked_token';
  static readonly AUTHENTICATE_SESSION_EXPIRE: string = 'authenticate_session_expire';
  static readonly AUTHENTICATE_CLIENT_ID_INVALID: string = 'authenticate_client_id_invalid';
  static readonly AUTHENTICATE_CREDENTIALS_REQUIRED: string = 'authenticate_credentials_required';
  static readonly AUTHENTICATE_CREDENTIALS_BAD_FORMAT: string =
    'authenticate_credentials_bad_format';
  static readonly AUTHENTICATE_CREDENTIALS_BAD_SCHEME: string =
    'authenticate_credentials_bad_scheme';

  // CODE PARAMETER
  static readonly PARAMETER_INVALID: string = 'parameter_invalid';
  static readonly PARAMETER_MISSING: string = 'parameter_missing';

  // base error
  static readonly ERROR_DEFAULT: { [key: string]: string } = {
    400: 'bad_request',
    401: 'unauthorized',
    402: 'request_failed',
    403: 'forbidden',
    404: 'not_found',
    409: 'conflict',
    429: 'rate_limit',
    500: 'internal_server_error',
  };
}
