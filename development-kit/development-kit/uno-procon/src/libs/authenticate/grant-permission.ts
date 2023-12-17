/**
 * @description Grant role & permission access
 */

export class GrantPermission {
  public static readonly ADMIN_ROLES = {
    ROOT: 'root',
    ADMIN: 'admin',
  };

  public static readonly CUSTOMER_ROLES = {
    CUSTOMER: 'customer',
  };

  public static readonly ROLES = {
    ...GrantPermission.ADMIN_ROLES,
    ...GrantPermission.CUSTOMER_ROLES,
  };

  //#region quick access role by array
  public static readonly adminRole = (function (): string[] {
    return Object.values(GrantPermission.ADMIN_ROLES);
  })();
  public static readonly userGroupRole = (() => {
    return Object.values(GrantPermission.CUSTOMER_ROLES);
  })();
  public static readonly allRole = ((): string[] => {
    return Object.values(GrantPermission.ROLES);
  })();
  //#endregion
}
