const USER_FIELD = ['_id', 'role', 'roles', 'email'];

export class AuthConfig {
  static readonly JWT = {
    FIELD: [...USER_FIELD],
  };
}
