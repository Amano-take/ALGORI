/// <reference types="express" />

declare namespace Express {
  export interface Request {
    user?: UserToken;
    polyglot?: any;
    [key: string]: any;
  }

  export interface UserToken {
    // primary info
    _id: string;
    role: string;
    email: string;
    // end
    iat: number;
    exp: number;
  }
}
