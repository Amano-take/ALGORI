/* eslint-disable @typescript-eslint/no-namespace */
import express = require('express');
import unless = require('express-unless');
import { ApiOption } from '../../commons';

export = jwt;

declare function jwt(options: jwt.Options): jwt.RequestHandler;

declare namespace jwt {
  export type secretType = string | Buffer;
  export type ErrorCode =
    | 'revoked_token'
    | 'invalid_token'
    | 'credentials_bad_scheme'
    | 'credentials_bad_format'
    | 'credentials_required';

  export interface SecretCallbackLong {
    (
      req: express.Request,
      header: any,
      payload: any,
      done: (err: any, secret?: secretType) => void,
    ): void;
  }

  export interface SecretCallback {
    (req: express.Request, payload: any, done: (err: any, secret?: secretType) => void): void;
  }

  export interface IsRevokedCallback {
    (req: express.Request, payload: any, done: (err: any, revoked?: boolean) => void): void;
  }

  export interface GetTokenCallback {
    (req: express.Request): any;
  }

  // release/v2
  export interface Options extends ApiOption {
    secret: secretType | SecretCallback | SecretCallbackLong;
    userProperty?: string;
    skip?: string[];
    credentialsRequired?: boolean;
    isRevoked?: IsRevokedCallback;
    requestProperty?: string;
    getToken?: GetTokenCallback;

    [property: string]: any;
  }

  export interface RequestHandler extends express.RequestHandler {
    unless: typeof unless;
  }
}
