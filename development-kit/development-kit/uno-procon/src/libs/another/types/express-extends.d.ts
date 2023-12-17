/// <reference types="express" />

interface ResponseHelper {
  ok(data?: any): void;

  bad(): void;

  bad(code: string, message?: string, errors?: any): void;

  bad(errors?: any): void;

  badParam(errors?: any): void;
}

declare namespace Express {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Response extends ResponseHelper {}
}
