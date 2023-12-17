import camelcaseKeys = require('camelcase-keys');

export class Utils {
  public static camelCase(obj: any, deep = true) {
    return camelcaseKeys(obj, { deep: deep });
  }

  public createRandomeStr(num: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < num; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
  }

  public zeroPadding(num: number, len: number) {
    return (Array(len).join('0') + num).slice(-len);
  }
}
