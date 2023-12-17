import * as path from 'path';

export function normalizePath(input: string) {
  return path.normalize(input);
}

export function stringifyQueryParams(
  params: string | { [field: string]: number | string | boolean },
): string {
  let output = '';
  if (!params) return '';
  if ('string' === typeof params) {
    return params.replace(/\?{2,}/g, '?');
  }
  if ('object' === typeof params) {
    for (const k in params) {
      output += `&${k}=${params[k]}`;
    }
  }
  return '?' + output.substring(1);
}
