// import APP_CONFIG from '../../../configs/app.config';
import * as session from '../../another/types/express-session-multiple';

export interface ConfigLibModel {
  ENVIRONMENT: string;
  API_GATEWAY?: string;

  // [SECURE-CONFIG] Security configuration ========================================================
  SECURE?: {
    JWT: {
      TOKEN_EXPIRE: number;
      JWT_SECRET: string;
      FIELD: string[];
      ALGORITHMS?: string[];
    };
    API_RESTRICT?: {
      CLIENT_IDS?: string[];
      CLIENT_SECRET: string;
    };
    /**
     * @field SESSION_APPROVE
     * @description config approve session build in service
     */
    SESSION_APPROVE?: boolean;
    SESSION?: {
      SECRET: string;
      CONFIG_SECURES: { NAME?: string; DOMAIN?: string }[];
      STORE_CONFIG: session.Store | session.MemoryStore;
      COOKIE: {
        MAX_AGE: number;
        SIGNED: boolean;
        HTTP_ONLY: boolean;
        DOMAIN: string;
        SECURE: boolean;
      };
      ROLLING: boolean;
      SAVE_UNINITIALIZED: boolean;
      RE_SAVE: boolean;
    };
  };

  // config common ===================================================================================
  PAGE_SIZE: number;
}
